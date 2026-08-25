"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct, getCategories } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";

type Category = {
  id: number;
  name: string;
};

type Variant = {
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  price: string;
  stock: string;
};

type ImageInput = {
  url: string;
  alt: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([
    { size: "", color: "", colorHex: "", sku: "", price: "", stock: "0" },
  ]);

  const [images, setImages] = useState<ImageInput[]>([{ url: "", alt: "" }]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const cats = await getCategories();
    setCategories(cats);
  }

  function addVariant() {
    setVariants([
      ...variants,
      { size: "", color: "", colorHex: "", sku: "", price: "", stock: "0" },
    ]);
  }

  function removeVariant(index: number) {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof Variant, value: string) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  function addImage() {
    setImages([...images, { url: "", alt: "" }]);
  }

  function removeImage(index: number) {
    if (images.length === 1) return;
    setImages(images.filter((_, i) => i !== index));
  }

  function updateImage(index: number, field: keyof ImageInput, value: string) {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: value };
    setImages(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !basePrice || !categoryId) {
      alert("Please fill in required fields");
      return;
    }

    setLoading(true);
    try {
      await createProduct({
        name,
        description,
        shortDescription,
        basePrice: parseFloat(basePrice),
        categoryId: parseInt(categoryId),
        brand,
        isFeatured,
        variants: variants
          .filter((v) => v.sku && v.price)
          .map((v) => ({
            size: v.size || undefined,
            color: v.color || undefined,
            colorHex: v.colorHex || undefined,
            sku: v.sku,
            price: parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
          })),
        images: images
          .filter((img) => img.url)
          .map((img, i) => ({
            url: img.url,
            alt: img.alt || undefined,
            isPrimary: i === 0,
          })),
      });
      router.push("/admin/products");
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief product description"
                maxLength={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (PHP) *
                </label>
                <Input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand name"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  Featured Product
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  Add size/color variants with SKUs and stock
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-1" />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-gray-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Variant {index + 1}
                  </span>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Size
                    </label>
                    <Input
                      value={variant.size}
                      onChange={(e) =>
                        updateVariant(index, "size", e.target.value)
                      }
                      placeholder="e.g. S, M, L"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Color
                    </label>
                    <Input
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(index, "color", e.target.value)
                      }
                      placeholder="e.g. Red"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Color Hex
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={variant.colorHex || "#000000"}
                        onChange={(e) =>
                          updateVariant(index, "colorHex", e.target.value)
                        }
                        className="w-10 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={variant.colorHex}
                        onChange={(e) =>
                          updateVariant(index, "colorHex", e.target.value)
                        }
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      SKU *
                    </label>
                    <Input
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, "sku", e.target.value)
                      }
                      placeholder="e.g. TC-SHIRT-001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Price (PHP) *
                    </label>
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(index, "price", e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Stock
                    </label>
                    <Input
                      type="number"
                      value={variant.stock}
                      onChange={(e) =>
                        updateVariant(index, "stock", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Add image URLs for the product</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addImage}>
                <Plus className="w-4 h-4 mr-1" />
                Add Image
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <Input
                    value={image.url}
                    onChange={(e) => updateImage(index, "url", e.target.value)}
                    placeholder="Image URL"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={image.alt}
                    onChange={(e) => updateImage(index, "alt", e.target.value)}
                    placeholder="Alt text (optional)"
                  />
                </div>
                {images.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
