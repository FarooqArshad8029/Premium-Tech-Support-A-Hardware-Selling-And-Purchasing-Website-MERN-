export const products = [
  {
    _id: "1",
    name: "Smartphone",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vitae turpis sit amet neque dapibus tincidunt.",
    price: 499.99,
    category: "Electronics",
    brand: "Apple",
    images: [
      {
        public_id: "image1_public_id",
        url: "https://cdn.pixabay.com/photo/2016/11/29/05/08/apple-1867461_640.jpg",
      },
    ],
    reviews: [
      {
        user: "user_id_1",
        name: "John Doe",
        rating: 4.5,
        comment: "Great smartphone!",
      },
      {
        user: "user_id_2",
        name: "Jane Doe",
        rating: 5,
        comment: "Best phone ever!",
      },
    ],
    quantity: 10,
    color: "Black",
    size: "6 inches",
    weight: 0.3,
    dimensions: {
      length: 5,
      width: 3,
      height: 0.5,
    },
    seller: {
      _id: "1",
      name: "Apple Store",
      companyName: "Apple Inc.",
      companyDescription: "Leading technology company",
      address: "1 Infinite Loop, Cupertino, CA 95014",
      phoneNumber: "1-800-MY-APPLE",
      website: "https://www.apple.com",
      isVerified: true,
      isBanned: false,
    },
  },
  {
    _id: "2",
    name: "Running Shoes",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vitae turpis sit amet neque dapibus tincidunt.",
    price: 89.99,
    category: "Sports & Outdoors",
    brand: "Nike",
    images: [
      {
        public_id: "image2_public_id",
        url: "https://cdn.shopify.com/s/files/1/1692/9471/products/93f49489-6f4e-4e95-85c0-622442f7e0aa-Img-shoe_large.jpg?v=1710922338",
      },
    ],
    reviews: [
      {
        user: "user_id_3",
        name: "Alice Smith",
        rating: 4,
        comment: "Very comfortable!",
      },
      {
        user: "user_id_3",
        name: "Alice Smith",
        rating: 4,
        comment: "Very comfortable!",
      },
    ],
    quantity: 20,
    color: "Red",
    size: "US 10",
    weight: 0.5,
    dimensions: {
      length: 12,
      width: 4,
      height: 6,
    },
    seller: {
      _id: "2",
      name: "Nike Store",
      companyName: "Nike Inc.",
      companyDescription: "Leading sports brand",
      address: "123 Nike Street, Beaverton, OR 97005",
      phoneNumber: "1-800-344-6453",
      website: "https://www.nike.com",
      isVerified: true,
      isBanned: false,
    },
  },
  {
    _id: "3",
    name: "Laptop",
    description: "A powerful laptop for all your computing needs.",
    price: 1099.99,
    category: "Electronics",
    brand: "Dell",
    images: [
      {
        public_id: "image3_public_id",
        url: "https://p3-ofp.static.pub/fes/cms/2023/02/10/o4l7gt9tgdh9i8phbid2c1ehjo35z8376943.png",
      },
    ],
    reviews: [
      {
        user: "user_id_4",
        name: "Robert Johnson",
        rating: 4.8,
        comment: "Excellent laptop!",
      },
      {
        user: "user_id_5",
        name: "Emily Brown",
        rating: 4.5,
        comment: "Very satisfied with the performance.",
      },
    ],
    quantity: 15,
    color: "Silver",
    size: "15 inches",
    weight: 1.2,
    dimensions: {
      length: 14,
      width: 9,
      height: 0.7,
    },
    seller: {
      _id: "3",
      name: "Dell Store",
      companyName: "Dell Inc.",
      companyDescription: "Leading technology company",
      address: "1 Dell Way, Round Rock, TX 78682",
      phoneNumber: "1-800-624-9897",
      website: "https://www.dell.com",
      isVerified: true,
      isBanned: false,
    },
  },
  {
    _id: "4",
    name: "Bluetooth Speaker",
    description:
      "Enjoy your favorite music with this portable Bluetooth speaker.",
    price: 79.99,
    category: "Electronics",
    brand: "Sony",
    images: [
      {
        public_id: "image4_public_id",
        url: "https://audionic.co/cdn/shop/files/Iqra20PortableSpeaker.png?v=1709116341",
      },
    ],
    reviews: [],
    quantity: 25,
    color: "Black",
    size: "Small",
    weight: 0.5,
    dimensions: {
      length: 8,
      width: 4,
      height: 3,
    },
    seller: {
      _id: "4",
      name: "Sony Store",
      companyName: "Sony Corporation",
      companyDescription: "Leading electronics company",
      address: "1-7-1 Konan, Minato-ku, Tokyo 108-0075, Japan",
      phoneNumber: "+81 (0)3-6748-2111",
      website: "https://www.sony.com",
      isVerified: true,
      isBanned: false,
    },
  },
  {
    _id: "5",
    name: "Coffee Maker",
    description: "Start your day with a freshly brewed cup of coffee.",
    price: 49.99,
    category: "Home & Kitchen",
    brand: "Keurig",
    images: [
      {
        public_id: "image5_public_id",
        url: "https://static.wixstatic.com/media/e6e3ae_4a93f4ee8b7942d28f6818a54c0ccc06~mv2.jpg/v1/fill/w_650,h_525,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/e6e3ae_4a93f4ee8b7942d28f6818a54c0ccc06~mv2.jpg",
      },
    ],
    reviews: [],
    quantity: 30,
    color: "Black",
    size: "Medium",
    weight: 2.0,
    dimensions: {
      length: 10,
      width: 6,
      height: 12,
    },
    seller: {
      _id: "5",
      name: "Keurig Store",
      companyName: "Keurig Dr Pepper",
      companyDescription: "Beverage company",
      address: "53 South Avenue, Burlington, MA 01803",
      phoneNumber: "1-866-901-BREW (2739)",
      website: "https://www.keurig.com",
      isVerified: true,
      isBanned: false,
    },
  },
];