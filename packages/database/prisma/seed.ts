import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod, StockMovementType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Divye Electronics Solutions...');

  // ─── CLEANUP ────────────────────────────────────────────────────────────────
  await prisma.orderStatusHistory.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.productSeo.deleteMany();
  await prisma.productSpec.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleanup done');

  // ─── SUPPLIERS ──────────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Samsung India Electronics Pvt. Ltd.',
        email: 'supply@samsung-india.com',
        phone: '01140507050',
        address: 'Samsung India Electronics Pvt. Ltd., 20th to 24th Floor, Two Horizon Centre, Golf Course Road, Sector 43, DLF Phase V, Gurugram, Haryana 122202',
        notes: 'Primary supplier for Samsung TVs, mobiles, and home appliances. Net 30 payment terms.',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Bosch India Distributors',
        email: 'orders@bosch-india-dist.in',
        phone: '08028964000',
        address: 'Bosch Limited, Hosur Road, Adugodi, Bengaluru, Karnataka 560030',
        notes: 'Authorized distributor for Bosch power tools and appliances. Minimum order ₹50,000.',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Havells India Ltd. — Regional Depot',
        email: 'depot.patna@havells.com',
        phone: '05122232311',
        address: 'Havells Regional Depot, Ashiana Nagar, Patna, Bihar 800025',
        notes: 'Local depot for Havells wiring accessories, fans, and small appliances. Same-week delivery.',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Syska LED Lights — Bihar Distributor',
        email: 'bihar@syska.in',
        phone: '07612345678',
        address: 'Syska Authorized Distributor, Frazer Road, Patna, Bihar 800001',
        notes: 'Syska LED bulbs, panels, and strip lights. 15-day return window for defective stock.',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${suppliers.length} suppliers created`);

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────
  const [catTV, catAC, catAppliances, catLighting, catTools, catMobiles] = await Promise.all([
    prisma.category.create({ data: { name: 'Televisions', slug: 'televisions', description: 'Smart TVs, LED TVs, and OLED displays', sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Air Conditioners', slug: 'air-conditioners', description: 'Split ACs, window ACs, and portable ACs', sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'Home Appliances', slug: 'home-appliances', description: 'Kitchen and household electrical appliances', sortOrder: 3 } }),
    prisma.category.create({ data: { name: 'Lighting', slug: 'lighting', description: 'LED bulbs, tube lights, panels, and decorative lighting', sortOrder: 4 } }),
    prisma.category.create({ data: { name: 'Power Tools', slug: 'power-tools', description: 'Drills, grinders, and professional power tools', sortOrder: 5 } }),
    prisma.category.create({ data: { name: 'Mobile & Accessories', slug: 'mobile-accessories', description: 'Smartphones, chargers, and mobile accessories', sortOrder: 6 } }),
  ]);

  const [catSmartTV, catFridge, catWashingMachine, catLEDBulb, catDrills] = await Promise.all([
    prisma.category.create({ data: { name: 'Smart TVs', slug: 'smart-tvs', parentId: catTV.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Refrigerators', slug: 'refrigerators', parentId: catAppliances.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Washing Machines', slug: 'washing-machines', parentId: catAppliances.id, sortOrder: 2 } }),
    prisma.category.create({ data: { name: 'LED Bulbs', slug: 'led-bulbs', parentId: catLighting.id, sortOrder: 1 } }),
    prisma.category.create({ data: { name: 'Drills & Drivers', slug: 'drills-drivers', parentId: catTools.id, sortOrder: 1 } }),
  ]);
  console.log('✅ Categories created');

  // ─── USERS ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@5678', 12);
  const customerHash = await bcrypt.hash('Test@1234', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'kshristi15@gmail.com',
      phone: '9771375946',
      passwordHash: adminHash,
      name: 'Divye Admin',
      role: Role.ADMIN,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'reachshristikumari@gmail.com',
        phone: '1234567891',
        passwordHash: customerHash,
        name: 'Rahul Kumar',
        role: Role.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'priya.singh@gmail.com',
        phone: '9334100002',
        passwordHash: customerHash,
        name: 'Priya Singh',
        role: Role.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: false,
      },
    }),
    prisma.user.create({
      data: {
        email: 'amit.verma@yahoo.co.in',
        phone: '9334100003',
        passwordHash: customerHash,
        name: 'Amit Verma',
        role: Role.CUSTOMER,
        isEmailVerified: false,
        isPhoneVerified: false,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sunita.devi@gmail.com',
        phone: '9334100004',
        passwordHash: customerHash,
        name: 'Sunita Devi',
        role: Role.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'vikram.gupta@rediffmail.com',
        phone: '9334100005',
        passwordHash: customerHash,
        name: 'Vikram Gupta',
        role: Role.CUSTOMER,
        isEmailVerified: true,
        isPhoneVerified: false,
      },
    }),
  ]);
  console.log(`✅ ${customers.length + 1} users created`);

  // ─── ADDRESSES ──────────────────────────────────────────────────────────────
  const [addr1, addr2, addr3, addr4] = await Promise.all([
    prisma.address.create({
      data: {
        userId: customers[0].id,
        name: 'Rahul Kumar',
        phone: '9334100001',
        line1: 'House No. 45, Rajendra Nagar',
        line2: 'Near Dak Bungalow',
        city: 'Patna',
        state: 'Bihar',
        pincode: '800016',
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[1].id,
        name: 'Priya Singh',
        phone: '9334100002',
        line1: 'Flat 3B, Shivam Apartments',
        line2: 'Boring Road',
        city: 'Patna',
        state: 'Bihar',
        pincode: '800001',
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[2].id,
        name: 'Amit Verma',
        phone: '9334100003',
        line1: '12, Kankarbagh Colony',
        city: 'Patna',
        state: 'Bihar',
        pincode: '800020',
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        userId: customers[3].id,
        name: 'Sunita Devi',
        phone: '9334100004',
        line1: 'Plot 7, Sector 3, Shastri Nagar',
        line2: 'Beside BSEB Office',
        city: 'Patna',
        state: 'Bihar',
        pincode: '800023',
        isDefault: true,
      },
    }),
  ]);
  console.log('✅ Addresses created');

  // ─── PRODUCTS ───────────────────────────────────────────────────────────────

  // 1. Samsung 55" Smart TV
  const tvSamsung = await prisma.product.create({
    data: {
      name: 'Samsung 55" Crystal 4K UHD Smart TV',
      description: "Experience stunning 4K Crystal UHD picture quality with Samsung's Crystal Processor 4K. The slim bezel design and built-in Alexa make this the perfect centerpiece for your living room. PurColor technology delivers an expanded range of shades for vivid, lifelike images.",
      categoryId: catSmartTV.id,
      brand: 'Samsung',
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Samsung 55" Crystal 4K TV - Front View', sortOrder: 0, isPrimary: true },
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Samsung 55" Crystal 4K TV - Back View', sortOrder: 1 },
        ],
      },
      specifications: {
        create: [
          { key: 'Screen Size', value: '55 inches (139.7 cm)', sortOrder: 0 },
          { key: 'Resolution', value: '4K UHD (3840 x 2160)', sortOrder: 1 },
          { key: 'Display Type', value: 'LED', sortOrder: 2 },
          { key: 'Refresh Rate', value: '60 Hz', sortOrder: 3 },
          { key: 'HDR', value: 'HDR10+', sortOrder: 4 },
          { key: 'Smart TV Platform', value: 'Tizen OS', sortOrder: 5 },
          { key: 'Connectivity', value: '3x HDMI, 2x USB, Bluetooth 5.2, Wi-Fi', sortOrder: 6 },
          { key: 'Sound Output', value: '20W (2.0 Channel)', sortOrder: 7 },
          { key: 'Warranty', value: '1 Year Comprehensive + 1 Year Panel', sortOrder: 8 },
        ],
      },
    },
  });

  const tvVariant = await prisma.productVariant.create({
    data: {
      productId: tvSamsung.id,
      sku: 'SAM-TV-55CU8570-BLK',
      name: '55 Inch - Black',
      price: 46990,
      mrp: 64900,
      gstPercent: 28,
      hsnCode: '85287200',
      stockQty: 12,
      reservedQty: 0,
      lowStockThreshold: 3,
      supplierId: suppliers[0].id,
      attributes: { color: 'Glossy Black', size: '55 inch', modelNumber: 'UA55CU8570ULXL' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: tvSamsung.id,
      metaTitle: 'Samsung 55 Inch 4K Smart TV | Buy Online at Divye Electronics Patna',
      metaDescription: 'Buy Samsung 55" Crystal 4K UHD Smart TV at best price in Patna. Crystal Processor 4K, HDR10+, Tizen OS. Free delivery across Bihar. EMI available.',
      slug: 'samsung-55-inch-crystal-4k-uhd-smart-tv',
      focusKeyword: 'Samsung 55 inch 4K TV Patna',
      keywords: ['samsung tv patna', 'samsung 4k tv', '55 inch smart tv', 'crystal uhd tv bihar'],
      ogTitle: 'Samsung 55" Crystal 4K Smart TV – Best Price in Patna',
      ogDescription: 'Crystal clear 4K picture, HDR10+, and Tizen OS. Available now at Divye Electronics, Patna.',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Samsung 55" Crystal 4K UHD Smart TV',
        brand: { '@type': 'Brand', name: 'Samsung' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 46990, availability: 'https://schema.org/InStock' },
      },
    },
  });

  // 2. Voltas 1.5 Ton 5 Star Inverter Split AC
  const voltasAC = await prisma.product.create({
    data: {
      name: 'Voltas 1.5 Ton 5 Star Inverter Split AC',
      description: 'Voltas 185V Vectra Élite delivers industry-leading energy efficiency with its 5-star rated inverter compressor. Designed for Indian summers, it features 100% copper condenser coils, anti-dust filter, and auto-clean function for hassle-free maintenance.',
      categoryId: catAC.id,
      brand: 'Voltas',
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Voltas 1.5 Ton Split AC - Indoor Unit', sortOrder: 0, isPrimary: true },
        ],
      },
      specifications: {
        create: [
          { key: 'Capacity', value: '1.5 Ton', sortOrder: 0 },
          { key: 'Energy Rating', value: '5 Star (BEE 2024)', sortOrder: 1 },
          { key: 'Type', value: 'Inverter Split AC', sortOrder: 2 },
          { key: 'Cooling Capacity', value: '5100W', sortOrder: 3 },
          { key: 'Refrigerant', value: 'R-32 (Eco-Friendly)', sortOrder: 4 },
          { key: 'Annual Energy Consumption', value: '734.9 units', sortOrder: 5 },
          { key: 'Noise Level (Indoor)', value: '32 dB', sortOrder: 6 },
          { key: 'Special Features', value: 'Auto Clean, Sleep Mode, Turbo Cool, Wi-Fi Ready', sortOrder: 7 },
          { key: 'Warranty', value: '1 Year Comprehensive + 5 Year Compressor', sortOrder: 8 },
        ],
      },
    },
  });

  const acVariant = await prisma.productVariant.create({
    data: {
      productId: voltasAC.id,
      sku: 'VOLT-AC-185VECTRA-WH',
      name: '1.5 Ton - White',
      price: 38990,
      mrp: 52000,
      gstPercent: 28,
      hsnCode: '84152010',
      stockQty: 8,
      reservedQty: 1,
      lowStockThreshold: 2,
      supplierId: suppliers[2].id,
      attributes: { color: 'White', tons: '1.5', starRating: '5 Star', modelNumber: '185V Vectra Elite' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: voltasAC.id,
      metaTitle: 'Voltas 1.5 Ton 5 Star Inverter AC | Buy in Patna | Divye Electronics',
      metaDescription: 'Buy Voltas 185V Vectra Elite 1.5 Ton 5 Star Inverter Split AC in Patna. Auto clean, R-32 refrigerant, 5-year compressor warranty. Free installation available.',
      slug: 'voltas-1-5-ton-5-star-inverter-split-ac',
      focusKeyword: 'Voltas 1.5 ton AC Patna',
      keywords: ['voltas ac patna', '5 star inverter ac', 'split ac bihar', 'voltas 185v'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Voltas 1.5 Ton 5 Star Inverter Split AC',
        brand: { '@type': 'Brand', name: 'Voltas' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 38990, availability: 'https://schema.org/InStock' },
      },
    },
  });

  // 3. Samsung Double Door Refrigerator
  const samsungFridge = await prisma.product.create({
    data: {
      name: 'Samsung 415L 3 Star Double Door Refrigerator',
      description: 'The Samsung RT42CB66248U features Digital Inverter Technology for consistent cooling with less noise and energy. Twin Cooling Plus maintains optimal humidity levels to keep food fresh for longer. All-Around Cooling ensures even temperature distribution throughout.',
      categoryId: catFridge.id,
      brand: 'Samsung',
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Samsung 415L Double Door Fridge - Silver', sortOrder: 0, isPrimary: true },
        ],
      },
      specifications: {
        create: [
          { key: 'Capacity', value: '415 Litres', sortOrder: 0 },
          { key: 'Energy Rating', value: '3 Star (BEE 2024)', sortOrder: 1 },
          { key: 'Type', value: 'Double Door (Frost Free)', sortOrder: 2 },
          { key: 'Compressor', value: 'Digital Inverter', sortOrder: 3 },
          { key: 'Refrigerant', value: 'R-600a', sortOrder: 4 },
          { key: 'Annual Energy Consumption', value: '235 units', sortOrder: 5 },
          { key: 'Dimensions (H x W x D)', value: '176.8 x 67.8 x 70.2 cm', sortOrder: 6 },
          { key: 'Warranty', value: '1 Year Comprehensive + 10 Year Compressor', sortOrder: 7 },
        ],
      },
    },
  });

  const fridgeVariant1 = await prisma.productVariant.create({
    data: {
      productId: samsungFridge.id,
      sku: 'SAM-RF-RT42CB66248U-SLV',
      name: '415L - Elegant Inox (Silver)',
      price: 41990,
      mrp: 57900,
      gstPercent: 18,
      hsnCode: '84181090',
      stockQty: 5,
      reservedQty: 0,
      lowStockThreshold: 2,
      supplierId: suppliers[0].id,
      attributes: { color: 'Elegant Inox', capacity: '415L', modelNumber: 'RT42CB66248UTL' },
    },
  });

  const fridgeVariant2 = await prisma.productVariant.create({
    data: {
      productId: samsungFridge.id,
      sku: 'SAM-RF-RT42CB66248U-BLK',
      name: '415L - Black Inox',
      price: 43490,
      mrp: 59900,
      gstPercent: 18,
      hsnCode: '84181090',
      stockQty: 3,
      reservedQty: 0,
      lowStockThreshold: 2,
      supplierId: suppliers[0].id,
      attributes: { color: 'Black Inox', capacity: '415L', modelNumber: 'RT42CB66248UBL' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: samsungFridge.id,
      metaTitle: 'Samsung 415L 3 Star Double Door Refrigerator | Patna | Divye Electronics',
      metaDescription: 'Samsung 415L Frost Free Double Door Fridge with Digital Inverter, Twin Cooling Plus. Best price in Patna. 10-year compressor warranty.',
      slug: 'samsung-415l-double-door-refrigerator',
      focusKeyword: 'Samsung double door fridge Patna',
      keywords: ['samsung fridge patna', 'double door refrigerator bihar', '415 litre fridge', 'samsung digital inverter fridge'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Samsung 415L 3 Star Double Door Refrigerator',
        brand: { '@type': 'Brand', name: 'Samsung' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 41990, availability: 'https://schema.org/InStock' },
      },
    },
  });

  // 4. Bosch GSB 550 Drill
  const boschDrill = await prisma.product.create({
    data: {
      name: 'Bosch GSB 550 Professional Impact Drill',
      description: 'The Bosch GSB 550 is a powerful and reliable impact drill designed for professional and home use. With 550W motor power and two-speed gear, it handles drilling in wood, metal, masonry, and concrete with ease. The keyless chuck allows quick bit changes.',
      categoryId: catDrills.id,
      brand: 'Bosch',
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Bosch GSB 550 Impact Drill', sortOrder: 0, isPrimary: true },
        ],
      },
      specifications: {
        create: [
          { key: 'Power', value: '550W', sortOrder: 0 },
          { key: 'No-Load Speed', value: '0-3000 rpm', sortOrder: 1 },
          { key: 'Impact Rate', value: '0-48000 bpm', sortOrder: 2 },
          { key: 'Chuck Size', value: '13 mm (Keyless)', sortOrder: 3 },
          { key: 'Drilling Capacity (Concrete)', value: '13 mm', sortOrder: 4 },
          { key: 'Drilling Capacity (Steel)', value: '10 mm', sortOrder: 5 },
          { key: 'Drilling Capacity (Wood)', value: '25 mm', sortOrder: 6 },
          { key: 'Weight', value: '1.7 kg', sortOrder: 7 },
          { key: 'Warranty', value: '1 Year', sortOrder: 8 },
        ],
      },
    },
  });

  const drillVariant = await prisma.productVariant.create({
    data: {
      productId: boschDrill.id,
      sku: 'BOSCH-GSB550-KIT',
      name: 'GSB 550 with Kitbox',
      price: 3299,
      mrp: 4500,
      gstPercent: 18,
      hsnCode: '84672100',
      stockQty: 25,
      reservedQty: 0,
      lowStockThreshold: 5,
      supplierId: suppliers[1].id,
      attributes: { color: 'Blue/Black', includes: 'Drill, Auxiliary Handle, Depth Gauge, Kitbox', modelNumber: 'GSB 550' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: boschDrill.id,
      metaTitle: 'Bosch GSB 550 Impact Drill | Buy Power Tools in Patna | Divye Electronics',
      metaDescription: 'Buy Bosch GSB 550 Professional Impact Drill in Patna at best price. 550W, 13mm chuck, keyless. Perfect for home and professional use. COD available.',
      slug: 'bosch-gsb-550-professional-impact-drill',
      focusKeyword: 'Bosch drill Patna',
      keywords: ['bosch drill patna', 'impact drill bihar', 'gsb 550', 'bosch power tools patna'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Bosch GSB 550 Professional Impact Drill',
        brand: { '@type': 'Brand', name: 'Bosch' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 3299, availability: 'https://schema.org/InStock' },
      },
    },
  });

  // 5. Syska LED Bulb Pack of 6
  const syskaLED = await prisma.product.create({
    data: {
      name: 'Syska 9W LED Bulb B22 (Pack of 6)',
      description: 'Syska SSK-SRL-9W LED bulbs offer bright, energy-efficient lighting with 6500K cool daylight colour temperature. Each bulb replaces a 75W incandescent while consuming only 9W — saving up to 88% energy. BEE 5-star rated, RoHS compliant, and rated for 25,000 hours.',
      categoryId: catLEDBulb.id,
      brand: 'Syska',
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Syska 9W LED Bulb B22 Pack of 6', sortOrder: 0, isPrimary: true },
        ],
      },
      specifications: {
        create: [
          { key: 'Wattage', value: '9W', sortOrder: 0 },
          { key: 'Base Type', value: 'B22 (Bayonet)', sortOrder: 1 },
          { key: 'Colour Temperature', value: '6500K (Cool Daylight)', sortOrder: 2 },
          { key: 'Luminous Flux', value: '900 Lumens', sortOrder: 3 },
          { key: 'Incandescent Equivalent', value: '75W', sortOrder: 4 },
          { key: 'Life Span', value: '25,000 Hours', sortOrder: 5 },
          { key: 'Energy Rating', value: '5 Star (BEE)', sortOrder: 6 },
          { key: 'Pack Size', value: '6 Bulbs', sortOrder: 7 },
          { key: 'Warranty', value: '2 Years', sortOrder: 8 },
        ],
      },
    },
  });

  const ledVariant = await prisma.productVariant.create({
    data: {
      productId: syskaLED.id,
      sku: 'SYSKA-9W-B22-6PK-WD',
      name: 'Pack of 6 - Cool Daylight',
      price: 449,
      mrp: 599,
      gstPercent: 12,
      hsnCode: '94054090',
      stockQty: 2,            // LOW STOCK — below threshold of 10
      reservedQty: 0,
      lowStockThreshold: 10,
      supplierId: suppliers[3].id,
      attributes: { color: 'Cool Daylight 6500K', packSize: '6', base: 'B22' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: syskaLED.id,
      metaTitle: 'Syska 9W LED Bulb B22 Pack of 6 | Buy in Patna | Divye Electronics',
      metaDescription: 'Syska 9W B22 LED Bulb Pack of 6 at best price in Patna. 5-star BEE rated, 25000 hrs life, cool daylight. Bulk orders welcome.',
      slug: 'syska-9w-led-bulb-b22-pack-of-6',
      focusKeyword: 'Syska LED bulb Patna',
      keywords: ['syska led bulb patna', '9w led bulb b22', 'led bulb pack bihar', 'energy saving bulb patna'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Syska 9W LED Bulb B22 (Pack of 6)',
        brand: { '@type': 'Brand', name: 'Syska' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 449, availability: 'https://schema.org/InStock' },
      },
    },
  });

  // 6. LG 7 Kg Front Load Washing Machine
  const lgWasher = await prisma.product.create({
    data: {
      name: 'LG 7 Kg 5 Star Fully Automatic Front Load Washing Machine',
      description: 'The LG FHM1207SDM is packed with AI Direct Drive technology that senses load size and fabric type to apply the right amount of force, protecting clothes. Steam technology removes 99.9% of allergens. 6 Motion DD moves the drum in 6 different ways for the best wash performance.',
      categoryId: catWashingMachine.id,
      brand: 'LG',
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'LG 7 Kg Front Load Washing Machine - Silver', sortOrder: 0, isPrimary: true },
        ],
      },
      specifications: {
        create: [
          { key: 'Capacity', value: '7 Kg', sortOrder: 0 },
          { key: 'Energy Rating', value: '5 Star', sortOrder: 1 },
          { key: 'Type', value: 'Fully Automatic Front Load', sortOrder: 2 },
          { key: 'Motor', value: 'AI Direct Drive (10 Year Warranty)', sortOrder: 3 },
          { key: 'Spin Speed', value: '1200 RPM', sortOrder: 4 },
          { key: 'Wash Programs', value: '14', sortOrder: 5 },
          { key: 'Special Features', value: 'Steam, 6 Motion DD, AI DD, TurboWash', sortOrder: 6 },
          { key: 'Dimensions (H x W x D)', value: '84.5 x 60 x 56 cm', sortOrder: 7 },
          { key: 'Warranty', value: '2 Year Comprehensive + 10 Year Motor', sortOrder: 8 },
        ],
      },
    },
  });

  const washerVariant = await prisma.productVariant.create({
    data: {
      productId: lgWasher.id,
      sku: 'LG-WM-FHM1207SDM-SLV',
      name: '7 Kg - Middle Free Silver',
      price: 42990,
      mrp: 62000,
      gstPercent: 18,
      hsnCode: '84501200',
      stockQty: 6,
      reservedQty: 0,
      lowStockThreshold: 2,
      supplierId: suppliers[2].id,
      attributes: { color: 'Middle Free Silver', capacity: '7 Kg', modelNumber: 'FHM1207SDM' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: lgWasher.id,
      metaTitle: 'LG 7 Kg 5 Star Front Load Washing Machine | Buy in Patna | Divye Electronics',
      metaDescription: 'LG FHM1207SDM 7 Kg Front Load with AI Direct Drive, Steam, 1200 RPM. Best price in Patna. 10-year motor warranty. EMI and COD available.',
      slug: 'lg-7kg-5-star-front-load-washing-machine',
      focusKeyword: 'LG front load washing machine Patna',
      keywords: ['lg washing machine patna', 'front load washer bihar', '7kg washing machine', 'lg ai direct drive'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'LG 7 Kg 5 Star Fully Automatic Front Load Washing Machine',
        brand: { '@type': 'Brand', name: 'LG' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 42990, availability: 'https://schema.org/InStock' },
      },
    },
  });

  // 7. Samsung Galaxy M34 5G
  const galaxyM34 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy M34 5G Smartphone',
      description: 'Samsung Galaxy M34 5G brings a massive 6000mAh battery and 120Hz Super AMOLED display to the mid-range segment. Powered by Exynos 1280, it handles everyday tasks and gaming with ease. The triple rear camera with 50MP main lens captures stunning detail in any light.',
      categoryId: catMobiles.id,
      brand: 'Samsung',
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Samsung Galaxy M34 5G - Midnight Blue Front', sortOrder: 0, isPrimary: true },
          { url: 'https://res.cloudinary.com/dgbug7nr9/image/upload/v1782235600/myday/lhz8mn4jxljptv0zfquh.jpg', altText: 'Samsung Galaxy M34 5G - Back View', sortOrder: 1 },
        ],
      },
      specifications: {
        create: [
          { key: 'Processor', value: 'Exynos 1280 (5nm)', sortOrder: 0 },
          { key: 'Display', value: '6.5" FHD+ Super AMOLED, 120Hz', sortOrder: 1 },
          { key: 'RAM', value: '6 GB / 8 GB', sortOrder: 2 },
          { key: 'Storage', value: '128 GB (expandable to 1 TB)', sortOrder: 3 },
          { key: 'Rear Camera', value: '50 MP + 8 MP Ultra-Wide + 2 MP', sortOrder: 4 },
          { key: 'Front Camera', value: '13 MP', sortOrder: 5 },
          { key: 'Battery', value: '6000 mAh with 25W Fast Charging', sortOrder: 6 },
          { key: 'OS', value: 'Android 13 (One UI 5.1)', sortOrder: 7 },
          { key: '5G', value: 'Yes (13 Bands)', sortOrder: 8 },
          { key: 'Warranty', value: '1 Year', sortOrder: 9 },
        ],
      },
    },
  });

  const mobileVariant1 = await prisma.productVariant.create({
    data: {
      productId: galaxyM34.id,
      sku: 'SAM-M34-6GB-128-BLUE',
      name: '6 GB RAM / 128 GB - Midnight Blue',
      price: 16999,
      mrp: 20999,
      gstPercent: 18,
      hsnCode: '85171200',
      stockQty: 18,
      reservedQty: 2,
      lowStockThreshold: 5,
      supplierId: suppliers[0].id,
      attributes: { color: 'Midnight Blue', ram: '6 GB', storage: '128 GB' },
    },
  });

  const mobileVariant2 = await prisma.productVariant.create({
    data: {
      productId: galaxyM34.id,
      sku: 'SAM-M34-8GB-128-SLVR',
      name: '8 GB RAM / 128 GB - Prism Silver',
      price: 18999,
      mrp: 22999,
      gstPercent: 18,
      hsnCode: '85171200',
      stockQty: 10,
      reservedQty: 0,
      lowStockThreshold: 5,
      supplierId: suppliers[0].id,
      attributes: { color: 'Prism Silver', ram: '8 GB', storage: '128 GB' },
    },
  });

  await prisma.productSeo.create({
    data: {
      productId: galaxyM34.id,
      metaTitle: 'Samsung Galaxy M34 5G | Buy in Patna | Divye Electronics Solutions',
      metaDescription: 'Buy Samsung Galaxy M34 5G in Patna. 6000 mAh battery, 120Hz AMOLED, 50 MP camera, Exynos 1280. Best price in Bihar. Genuine with full warranty.',
      slug: 'samsung-galaxy-m34-5g-smartphone',
      focusKeyword: 'Samsung Galaxy M34 Patna',
      keywords: ['samsung galaxy m34 patna', 'm34 5g bihar', 'samsung 5g phone patna', '6000mah samsung phone'],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Samsung Galaxy M34 5G Smartphone',
        brand: { '@type': 'Brand', name: 'Samsung' },
        offers: { '@type': 'Offer', priceCurrency: 'INR', price: 16999, availability: 'https://schema.org/InStock' },
      },
    },
  });

  console.log('✅ Products created');

  // ─── INVENTORY LOGS (opening stock) ─────────────────────────────────────────
  const allVariants = [tvVariant, acVariant, fridgeVariant1, fridgeVariant2, drillVariant, ledVariant, washerVariant, mobileVariant1, mobileVariant2];
  for (const variant of allVariants) {
    await prisma.inventoryLog.create({
      data: {
        variantId: variant.id,
        type: StockMovementType.RESTOCK,
        quantityBefore: 0,
        quantityChange: variant.stockQty,
        quantityAfter: variant.stockQty,
        reason: 'Initial stock entry',
        reference: 'OPENING-STOCK-2024',
        createdBy: admin.id,
      },
    });
  }
  console.log('✅ Inventory logs created');

  // ─── COUPONS ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'WELCOME200',
        description: '₹200 off on first order above ₹2000',
        discountType: 'FLAT',
        discountValue: 200,
        minOrderValue: 2000,
        maxDiscount: 200,
        usageLimit: 500,
        usageCount: 47,
        isActive: true,
        expiresAt: new Date('2025-03-31'),
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'SUMMER10',
        description: '10% off on ACs and Coolers (max ₹3000)',
        discountType: 'PERCENT',
        discountValue: 10,
        minOrderValue: 15000,
        maxDiscount: 3000,
        usageLimit: 200,
        usageCount: 89,
        isActive: true,
        expiresAt: new Date('2025-06-30'),
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'DIVYE500',
        description: '₹500 off on orders above ₹25,000',
        discountType: 'FLAT',
        discountValue: 500,
        minOrderValue: 25000,
        maxDiscount: 500,
        usageLimit: 100,
        usageCount: 12,
        isActive: true,
        expiresAt: new Date('2025-12-31'),
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'EXPIRED20',
        description: 'Old 20% discount (expired)',
        discountType: 'PERCENT',
        discountValue: 20,
        minOrderValue: 5000,
        maxDiscount: 1000,
        usageLimit: 50,
        usageCount: 50,
        isActive: false,
        expiresAt: new Date('2024-01-01'),
      },
    }),
  ]);
  console.log('✅ Coupons created');

  // ─── ORDERS ─────────────────────────────────────────────────────────────────

  // Order 1: DELIVERED via Razorpay — Samsung TV
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'DE-2024-001',
      userId: customers[0].id,
      addressId: addr1.id,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.RAZORPAY,
      subtotal: 46990,
      discountAmount: 0,
      shippingCharge: 0,
      gstAmount: 10359.56,
      totalAmount: 46990,
      trackingId: 'BD1234567890',
      carrier: 'Blue Dart',
      createdAt: new Date('2024-09-10T10:30:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      variantId: tvVariant.id,
      productName: 'Samsung 55" Crystal 4K UHD Smart TV',
      variantName: '55 Inch - Black',
      sku: 'SAM-TV-55CU8570-BLK',
      quantity: 1,
      unitPrice: 46990,
      gstPercent: 28,
      totalPrice: 46990,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order1.id,
      method: PaymentMethod.RAZORPAY,
      status: PaymentStatus.PAID,
      amount: 46990,
      currency: 'INR',
      razorpayOrderId: 'order_OXfakeRzp001',
      razorpayPaymentId: 'pay_OXfakeRzp001',
      razorpaySignature: 'fakesig_001_verified',
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order1.id, status: OrderStatus.PENDING, note: 'Order placed', createdAt: new Date('2024-09-10T10:30:00Z') },
      { orderId: order1.id, status: OrderStatus.CONFIRMED, note: 'Payment confirmed via Razorpay', createdAt: new Date('2024-09-10T10:32:00Z') },
      { orderId: order1.id, status: OrderStatus.PROCESSING, note: 'Packed and ready for dispatch', createdAt: new Date('2024-09-11T09:00:00Z') },
      { orderId: order1.id, status: OrderStatus.SHIPPED, note: 'Dispatched via Blue Dart. AWB: BD1234567890', createdAt: new Date('2024-09-11T15:00:00Z') },
      { orderId: order1.id, status: OrderStatus.OUT_FOR_DELIVERY, note: 'Out for delivery', createdAt: new Date('2024-09-13T08:30:00Z') },
      { orderId: order1.id, status: OrderStatus.DELIVERED, note: 'Delivered to customer', createdAt: new Date('2024-09-13T14:00:00Z') },
    ],
  });

  // Order 2: SHIPPED via COD — Voltas AC with coupon
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'DE-2024-002',
      userId: customers[1].id,
      addressId: addr2.id,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      subtotal: 38990,
      discountAmount: 3000,
      shippingCharge: 0,
      gstAmount: 7920.44,
      totalAmount: 35990,
      couponCode: 'SUMMER10',
      trackingId: 'DTDC9876543210',
      carrier: 'DTDC',
      createdAt: new Date('2024-10-05T14:15:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      variantId: acVariant.id,
      productName: 'Voltas 1.5 Ton 5 Star Inverter Split AC',
      variantName: '1.5 Ton - White',
      sku: 'VOLT-AC-185VECTRA-WH',
      quantity: 1,
      unitPrice: 38990,
      gstPercent: 28,
      totalPrice: 38990,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order2.id,
      method: PaymentMethod.COD,
      status: PaymentStatus.PENDING,
      amount: 35990,
      currency: 'INR',
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order2.id, status: OrderStatus.PENDING, note: 'COD order placed', createdAt: new Date('2024-10-05T14:15:00Z') },
      { orderId: order2.id, status: OrderStatus.CONFIRMED, note: 'Order confirmed', createdAt: new Date('2024-10-06T09:00:00Z') },
      { orderId: order2.id, status: OrderStatus.PROCESSING, note: 'Packed', createdAt: new Date('2024-10-07T10:00:00Z') },
      { orderId: order2.id, status: OrderStatus.SHIPPED, note: 'Dispatched via DTDC. AWB: DTDC9876543210', createdAt: new Date('2024-10-07T16:30:00Z') },
    ],
  });

  // Order 3: CANCELLED + REFUNDED — Samsung Fridge
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'DE-2024-003',
      userId: customers[2].id,
      addressId: addr3.id,
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.REFUNDED,
      paymentMethod: PaymentMethod.RAZORPAY,
      subtotal: 41990,
      discountAmount: 0,
      shippingCharge: 0,
      gstAmount: 6423.91,
      totalAmount: 41990,
      notes: 'Customer requested cancellation — purchased from local store',
      createdAt: new Date('2024-10-15T11:00:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order3.id,
      variantId: fridgeVariant1.id,
      productName: 'Samsung 415L 3 Star Double Door Refrigerator',
      variantName: '415L - Elegant Inox (Silver)',
      sku: 'SAM-RF-RT42CB66248U-SLV',
      quantity: 1,
      unitPrice: 41990,
      gstPercent: 18,
      totalPrice: 41990,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order3.id,
      method: PaymentMethod.RAZORPAY,
      status: PaymentStatus.REFUNDED,
      amount: 41990,
      currency: 'INR',
      razorpayOrderId: 'order_OXfakeRzp003',
      razorpayPaymentId: 'pay_OXfakeRzp003',
      razorpaySignature: 'fakesig_003_verified',
      refundId: 'rfnd_OXfake003',
      refundAmount: 41990,
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order3.id, status: OrderStatus.PENDING, note: 'Order placed', createdAt: new Date('2024-10-15T11:00:00Z') },
      { orderId: order3.id, status: OrderStatus.CONFIRMED, note: 'Payment received via Razorpay', createdAt: new Date('2024-10-15T11:02:00Z') },
      { orderId: order3.id, status: OrderStatus.CANCELLED, note: 'Cancelled by customer. Refund initiated.', createdAt: new Date('2024-10-15T13:00:00Z') },
    ],
  });

  // Order 4: PROCESSING via COD with coupon — Samsung M34
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'DE-2024-004',
      userId: customers[3].id,
      addressId: addr4.id,
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
      subtotal: 16999,
      discountAmount: 200,
      shippingCharge: 0,
      gstAmount: 2593.07,
      totalAmount: 16799,
      couponCode: 'WELCOME200',
      createdAt: new Date('2024-11-01T09:45:00Z'),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order4.id,
      variantId: mobileVariant1.id,
      productName: 'Samsung Galaxy M34 5G Smartphone',
      variantName: '6 GB RAM / 128 GB - Midnight Blue',
      sku: 'SAM-M34-6GB-128-BLUE',
      quantity: 1,
      unitPrice: 16999,
      gstPercent: 18,
      totalPrice: 16999,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order4.id,
      method: PaymentMethod.COD,
      status: PaymentStatus.PENDING,
      amount: 16799,
      currency: 'INR',
    },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId: order4.id, status: OrderStatus.PENDING, note: 'COD order placed', createdAt: new Date('2024-11-01T09:45:00Z') },
      { orderId: order4.id, status: OrderStatus.CONFIRMED, note: 'Order confirmed', createdAt: new Date('2024-11-01T10:00:00Z') },
      { orderId: order4.id, status: OrderStatus.PROCESSING, note: 'Preparing for dispatch', createdAt: new Date('2024-11-02T09:00:00Z') },
    ],
  });

  console.log('✅ Orders created');

  // ─── REVIEWS ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.review.create({
      data: {
        userId: customers[0].id,
        productId: tvSamsung.id,
        rating: 5,
        title: 'Superb picture quality!',
        body: 'Bought this for our living room and the picture is absolutely stunning. 4K content on OTT platforms looks jaw-dropping. Setup was easy and the Tizen OS is very smooth. Divye Electronics delivered it same week with careful packaging.',
        isVerified: true,
        isApproved: true,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[1].id,
        productId: voltasAC.id,
        rating: 4,
        title: 'Great cooling, installation was smooth',
        body: 'The AC cools our 200 sq ft bedroom in under 10 minutes even at 40°C outside. The auto-clean feature is very handy. Removing one star because the remote control feels a bit cheap for this price point.',
        isVerified: true,
        isApproved: true,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[2].id,
        productId: boschDrill.id,
        rating: 5,
        title: 'Professional quality at a fair price',
        body: 'Used this on a home renovation project — drilled through RCC walls without any issues. The kitbox keeps everything organised. Bosch quality is always reliable.',
        isVerified: false,
        isApproved: true,
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[3].id,
        productId: galaxyM34.id,
        rating: 4,
        title: 'Battery life is exceptional',
        body: 'The 6000 mAh battery easily lasts 2 days with moderate use. Display is vibrant. Camera is good for the price. Only complaint is it gets slightly warm during gaming.',
        isVerified: false,
        isApproved: false, // Pending admin approval
      },
    }),
  ]);
  console.log('✅ Reviews created');

  // ─── WISHLISTS ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.wishlistItem.create({ data: { userId: customers[0].id, productId: voltasAC.id } }),
    prisma.wishlistItem.create({ data: { userId: customers[0].id, productId: lgWasher.id } }),
    prisma.wishlistItem.create({ data: { userId: customers[1].id, productId: samsungFridge.id } }),
    prisma.wishlistItem.create({ data: { userId: customers[2].id, productId: tvSamsung.id } }),
    prisma.wishlistItem.create({ data: { userId: customers[3].id, productId: boschDrill.id } }),
  ]);
  console.log('✅ Wishlists created');

  // ─── CARTS ──────────────────────────────────────────────────────────────────
  const cart1 = await prisma.cart.create({ data: { userId: customers[4].id } });
  await prisma.cartItem.createMany({
    data: [
      { cartId: cart1.id, productId: syskaLED.id, variantId: ledVariant.id, quantity: 4 },
      { cartId: cart1.id, productId: boschDrill.id, variantId: drillVariant.id, quantity: 1 },
    ],
  });

  const cart2 = await prisma.cart.create({ data: { userId: customers[2].id } });
  await prisma.cartItem.create({
    data: { cartId: cart2.id, productId: galaxyM34.id, variantId: mobileVariant2.id, quantity: 1 },
  });
  console.log('✅ Carts created');

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:       admin@divyeelectronics.in  /  Admin@5678');
  console.log('  Customers:   rahul.kumar@gmail.com  (and 4 more)');
  console.log('               All customer password: Test@1234');
  console.log('  Products:    7 products, 9 variants across 6 categories');
  console.log('  Orders:      4 (DELIVERED, SHIPPED, CANCELLED/REFUNDED, PROCESSING)');
  console.log('  Coupons:     WELCOME200 | SUMMER10 | DIVYE500 | EXPIRED20');
  console.log('  ⚠️  Low stock: Syska LED bulbs (2 units, threshold 10)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());