import { db } from "@/db";
import {
  users,
  categories,
  products,
  productVariants,
  productImages,
  reviews,
} from "@/db/schema";
import { hash } from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // ==================== USERS ====================
  const passwordHash = await hash("admin123", 10);
  const customerPasswordHash = await hash("customer123", 10);

  await db
    .insert(users)
    .values([
      {
        name: "Admin",
        email: "admin@threadcraft.com",
        passwordHash,
        role: "admin",
        phone: "+63 917 123 4567",
      },
      {
        name: "Juan Dela Cruz",
        email: "customer@threadcraft.com",
        passwordHash: customerPasswordHash,
        role: "customer",
        phone: "+63 918 765 4321",
      },
    ])
    .onConflictDoNothing();
  console.log("Users seeded.");

  // ==================== CATEGORIES ====================
  await db
    .insert(categories)
    .values([
      {
        name: "Tops",
        slug: "tops",
        description: "Shirts, tees, blouses, and more",
        image: "https://placehold.co/600x400?text=Tops",
      },
      {
        name: "Bottoms",
        slug: "bottoms",
        description: "Pants, shorts, skirts, and jeans",
        image: "https://placehold.co/600x400?text=Bottoms",
      },
      {
        name: "Dresses",
        slug: "dresses",
        description: "Casual and formal dresses",
        image: "https://placehold.co/600x400?text=Dresses",
      },
      {
        name: "Outerwear",
        slug: "outerwear",
        description: "Jackets, coats, and hoodies",
        image: "https://placehold.co/600x400?text=Outerwear",
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Hats, bags, scarves, and more",
        image: "https://placehold.co/600x400?text=Accessories",
      },
    ])
    .onConflictDoNothing();
  console.log("Categories seeded.");

  // ==================== PRODUCTS ====================
  const productData = [
    {
      name: "Classic Linen Shirt",
      slug: "classic-linen-shirt",
      description:
        "A breathable linen shirt perfect for the tropical Philippine weather. Relaxed fit with a camp collar.",
      shortDescription: "Breathable linen shirt with camp collar",
      basePrice: "1299.00",
      categoryId: 1,
      brand: "ThreadCraft",
      isFeatured: true,
      tags: ["linen", "summer", "casual"],
    },
    {
      name: "Organic Cotton Tee",
      slug: "organic-cotton-tee",
      description:
        "A soft, sustainably made crewneck tee. Available in multiple colors. Made from 100% organic cotton.",
      shortDescription: "Sustainable organic cotton crewneck tee",
      basePrice: "799.00",
      categoryId: 1,
      brand: "ThreadCraft",
      isFeatured: false,
      tags: ["cotton", "basics", "sustainable"],
    },
    {
      name: "Slim Chino Pants",
      slug: "slim-chino-pants",
      description:
        "Tailored slim-fit chinos made from stretch twill. Comfortable and versatile for office or casual wear.",
      shortDescription: "Slim-fit stretch twill chinos",
      basePrice: "1499.00",
      categoryId: 2,
      brand: "ThreadCraft",
      isFeatured: true,
      tags: ["chinos", "slim-fit", "versatile"],
    },
    {
      name: "Relaxed Denim Jeans",
      slug: "relaxed-denim-jeans",
      description:
        "Classic relaxed-fit jeans in a mid-wash indigo. Durable denim with a comfortable rise.",
      shortDescription: "Classic relaxed-fit indigo jeans",
      basePrice: "1699.00",
      categoryId: 2,
      brand: "ThreadCraft",
      isFeatured: false,
      tags: ["denim", "jeans", "casual"],
    },
    {
      name: "Floral Wrap Dress",
      slug: "floral-wrap-dress",
      description:
        "A flattering wrap dress with a tropical floral print. Lightweight fabric ideal for brunch or evening outings.",
      shortDescription: "Tropical floral print wrap dress",
      basePrice: "1899.00",
      categoryId: 3,
      brand: "ThreadCraft",
      isFeatured: true,
      tags: ["dress", "floral", "feminine"],
    },
    {
      name: "Canvas Utility Jacket",
      slug: "canvas-utility-jacket",
      description:
        "A rugged utility jacket in washed canvas. Multiple pockets and a drawstring waist for a tailored look.",
      shortDescription: "Washed canvas utility jacket",
      basePrice: "2499.00",
      categoryId: 4,
      brand: "ThreadCraft",
      isFeatured: true,
      tags: ["jacket", "utility", "outerwear"],
    },
    {
      name: "Fleece Zip Hoodie",
      slug: "fleece-zip-hoodie",
      description:
        "A warm and cozy full-zip hoodie in premium fleece. Ribbed cuffs and hem with kangaroo pocket.",
      shortDescription: "Premium fleece full-zip hoodie",
      basePrice: "1599.00",
      categoryId: 4,
      brand: "ThreadCraft",
      isFeatured: false,
      tags: ["hoodie", "fleece", "warm"],
    },
    {
      name: "Woven Straw Tote",
      slug: "woven-straw-tote",
      description:
        "A handwoven straw tote bag with leather handles. Perfect for beach trips or market runs.",
      shortDescription: "Handwoven straw tote with leather handles",
      basePrice: "899.00",
      categoryId: 5,
      brand: "ThreadCraft",
      isFeatured: false,
      tags: ["bag", "straw", "summer"],
    },
    {
      name: "Ribbed Knit Midi Dress",
      slug: "ribbed-knit-midi-dress",
      description:
        "A body-hugging ribbed knit midi dress. Stretchy and comfortable with a side slit.",
      shortDescription: "Stretchy ribbed knit midi dress",
      basePrice: "1399.00",
      categoryId: 3,
      brand: "ThreadCraft",
      isFeatured: false,
      tags: ["dress", "knit", "midi"],
    },
    {
      name: "Pleated Wide-Leg Trousers",
      slug: "pleated-wide-leg-trousers",
      description:
        "Elegant wide-leg trousers with front pleats. A high-waisted silhouette that pairs beautifully with tucked-in tops.",
      shortDescription: "High-waisted pleated wide-leg trousers",
      basePrice: "1799.00",
      categoryId: 2,
      brand: "ThreadCraft",
      isFeatured: true,
      tags: ["trousers", "wide-leg", "elegant"],
    },
  ];

  await db.insert(products).values(productData).onConflictDoNothing();
  console.log("Products seeded.");

  // ==================== PRODUCT VARIANTS ====================
  const sizes = ["XS", "S", "M", "L", "XL"];
  const colorOptions: Record<
    number,
    { color: string; hex: string }[]
  > = {
    1: [
      { color: "White", hex: "#FFFFFF" },
      { color: "Beige", hex: "#F5F5DC" },
    ],
    2: [
      { color: "Black", hex: "#000000" },
      { color: "Navy", hex: "#1B1B3A" },
      { color: "White", hex: "#FFFFFF" },
    ],
    3: [
      { color: "Khaki", hex: "#C3B091" },
      { color: "Olive", hex: "#808000" },
      { color: "Black", hex: "#000000" },
    ],
    4: [
      { color: "Indigo", hex: "#3F51B5" },
      { color: "Light Wash", hex: "#B0C4DE" },
    ],
    5: [
      { color: "Red Floral", hex: "#DC143C" },
      { color: "Blue Floral", hex: "#4169E1" },
    ],
    6: [
      { color: "Army Green", hex: "#4B5320" },
      { color: "Tan", hex: "#D2B48C" },
    ],
    7: [
      { color: "Charcoal", hex: "#36454F" },
      { color: "Heather Grey", hex: "#9AA8BA" },
      { color: "Navy", hex: "#1B1B3A" },
    ],
    8: [
      { color: "Natural", hex: "#F5DEB3" },
    ],
    9: [
      { color: "Black", hex: "#000000" },
      { color: "Camel", hex: "#C19A6B" },
    ],
    10: [
      { color: "Charcoal", hex: "#36454F" },
      { color: "Cream", hex: "#FFFDD0" },
    ],
  };

  const allVariants: {
    productId: number;
    size: string;
    color: string;
    colorHex: string;
    sku: string;
    price: string;
    stock: number;
  }[] = [];

  for (let productId = 1; productId <= 10; productId++) {
    const colors = colorOptions[productId] || [{ color: "Default", hex: "#888888" }];
    for (const c of colors) {
      for (const size of sizes) {
        allVariants.push({
          productId,
          size,
          color: c.color,
          colorHex: c.hex,
          sku: `TC-${String(productId).padStart(3, "0")}-${c.color.toUpperCase().replace(/\s+/g, "")}-${size}`,
          price: productData[productId - 1].basePrice,
          stock: Math.floor(Math.random() * 40) + 10,
        });
      }
    }
  }

  await db.insert(productVariants).values(allVariants).onConflictDoNothing();
  console.log("Product variants seeded.");

  // ==================== PRODUCT IMAGES ====================
  const imageData: {
    productId: number;
    url: string;
    alt: string;
    sortOrder: number;
    isPrimary: boolean;
  }[] = [];

  for (let i = 0; i < productData.length; i++) {
    const pid = i + 1;
    const name = productData[i].name;
    imageData.push({
      productId: pid,
      url: `https://placehold.co/600x800?text=${encodeURIComponent(name)}`,
      alt: name,
      sortOrder: 0,
      isPrimary: true,
    });
    imageData.push({
      productId: pid,
      url: `https://placehold.co/600x800?text=${encodeURIComponent(name + " Detail")}`,
      alt: `${name} - Detail`,
      sortOrder: 1,
      isPrimary: false,
    });
  }

  await db.insert(productImages).values(imageData).onConflictDoNothing();
  console.log("Product images seeded.");

  // ==================== REVIEWS ====================
  const reviewData = [
    {
      userId: 2,
      productId: 1,
      rating: 5,
      title: "Perfect for Philippine weather!",
      comment:
        "Super breathable and lightweight. I wore this to a beach party in Siargao and got so many compliments.",
      isVerified: true,
    },
    {
      userId: 2,
      productId: 2,
      rating: 4,
      title: "Great basic tee",
      comment:
        "Soft fabric and holds up well after multiple washes. Runs slightly large, size down.",
      isVerified: true,
    },
    {
      userId: 2,
      productId: 3,
      rating: 5,
      title: "My go-to office pants",
      comment:
        "Stretch is perfect for sitting all day. The slim fit looks sharp without being too tight.",
      isVerified: true,
    },
    {
      userId: 2,
      productId: 5,
      rating: 5,
      title: "Absolutely stunning",
      comment:
        "The wrap style is so flattering. Fabric feels premium and the print is vibrant.",
      isVerified: true,
    },
    {
      userId: 2,
      productId: 6,
      rating: 4,
      title: "Solid jacket",
      comment:
        "Well-made with sturdy zippers. Pockets are very functional. A bit heavy for summer though.",
      isVerified: false,
    },
  ];

  await db.insert(reviews).values(reviewData).onConflictDoNothing();
  console.log("Reviews seeded.");

  console.log("Database seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
