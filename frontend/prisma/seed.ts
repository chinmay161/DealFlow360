import path from "node:path";
import dotenv from "dotenv";

// Ensure environment variables are loaded regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import {
  PrismaClient,
  UserRole,
  CustomerTier,
  QuotationStatus,
  ApprovalStatus,
  ApprovalPriority,
  WorkflowStepStatus,
} from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function toUUID(slug: string): string {
  if (!slug) return slug;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    return slug;
  }
  const hash = crypto.createHash("md5").update(`dealflow360:${slug}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}

async function main() {
  console.log("🌱 Starting DealFlow360 comprehensive India-first database seeding...");

  // Clean up existing domain tables for clean transition (preserving active user sessions)
  console.log("Cleaning up existing domain records for fresh seed...");
  await prisma.approvalHistory.deleteMany();
  await prisma.approvalWorkflowStep.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.productRecommendation.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.priceListItem.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany({
    where: {
      accounts: { none: {} },
      sessions: { none: {} },
    },
  });

  // =========================================================================
  // 1. USERS & PORTAL BUYERS (Deterministic Identifiers & Roles)
  // =========================================================================
  console.log("Creating seed users & portal contacts...");

  const usersData = [
    {
      id: "u-usr-0001-arjun-mehta",
      name: "Arjun Mehta",
      email: "arjun.mehta@dealflow360.in",
      role: UserRole.SALES_REP,
      avatarUrl: "/james-carter.jpg",
      createdAt: new Date("2026-06-01T08:00:00Z"),
    },
    {
      id: "u-usr-0002-vikram-desai",
      name: "Vikram Desai",
      email: "vikram.desai@dealflow360.in",
      role: UserRole.APPROVER,
      avatarUrl: null,
      createdAt: new Date("2026-06-01T08:00:00Z"),
    },
    {
      id: "u-usr-0003-meera-joshi",
      name: "Meera Joshi",
      email: "meera.joshi@dealflow360.in",
      role: UserRole.APPROVER,
      avatarUrl: null,
      createdAt: new Date("2026-06-01T08:00:00Z"),
    },
    {
      id: "u-usr-0004-rohan-sharma",
      name: "Rohan Sharma",
      email: "rohan.sharma@dealflow360.in",
      role: UserRole.SALES_REP,
      avatarUrl: null,
      createdAt: new Date("2026-06-10T08:00:00Z"),
    },
    {
      id: "u-usr-0005-priya-nair",
      name: "Priya Nair",
      email: "priya.nair@dealflow360.in",
      role: UserRole.SALES_REP,
      avatarUrl: null,
      createdAt: new Date("2026-06-15T08:00:00Z"),
    },
    {
      id: "u-usr-0006-aditya-kulkarni",
      name: "Aditya Kulkarni",
      email: "aditya.kulkarni@dealflow360.in",
      role: UserRole.SALES_REP,
      avatarUrl: null,
      createdAt: new Date("2026-06-20T08:00:00Z"),
    },
    {
      id: "u-usr-0007-rajiv-menon",
      name: "Rajiv Menon",
      email: "rajiv.menon@dealflow360.in",
      role: UserRole.ADMIN,
      avatarUrl: null,
      createdAt: new Date("2026-05-15T08:00:00Z"),
    },
    {
      id: "u-usr-0008-ananya-shah",
      name: "Ananya Shah",
      email: "ananya.shah@apexinfotech.example",
      role: UserRole.CUSTOMER,
      avatarUrl: null,
      createdAt: new Date("2026-06-05T08:00:00Z"),
    },
  ];

  const seededUsers: Record<string, string> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        avatarUrl: u.avatarUrl,
      },
      create: {
        id: toUUID(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
      },
    });
    seededUsers[u.email] = user.id;
  }

  // =========================================================================
  // 2. PRODUCT CATEGORIES (Enterprise Hardware, Services, Cloud/SaaS)
  // =========================================================================
  console.log("Creating product categories...");

  const categoriesData = [
    {
      id: "cat-001-hw",
      name: "Enterprise Hardware Systems",
      description: "Laptops, workstations, displays, and client accessories",
      parentId: null,
    },
    {
      id: "cat-002-hw-laptops",
      name: "Laptops & Mobile Workstations",
      description: "Professional high-performance laptops for engineering and business",
      parentId: "cat-001-hw",
    },
    {
      id: "cat-003-hw-displays",
      name: "Displays & Professional Monitors",
      description: "Color-accurate 4K/5K studio monitors and ultrawide setups",
      parentId: "cat-001-hw",
    },
    {
      id: "cat-004-hw-accessories",
      name: "Docking & Workspace Accessories",
      description: "Thunderbolt docks, dual chargers, and ergonomic peripherals",
      parentId: "cat-001-hw",
    },
    {
      id: "cat-005-srv",
      name: "Enterprise Professional Services",
      description: "Implementation, migration, architecture consulting, and SLA support",
      parentId: null,
    },
    {
      id: "cat-006-srv-deploy",
      name: "Setup & Migration Services",
      description: "Deployment, cloud transition, and data migration engineering",
      parentId: "cat-005-srv",
    },
    {
      id: "cat-007-srv-support",
      name: "Maintenance & Extended Care",
      description: "Hardware warranties, next-business-day SLA, and premium support",
      parentId: "cat-005-srv",
    },
    {
      id: "cat-008-cld",
      name: "Cloud & Governance SaaS",
      description: "Software licenses, governance suites, and cloud infrastructure",
      parentId: null,
    },
    {
      id: "cat-009-cld-sec",
      name: "Security & Compliance Solutions",
      description: "FIDO2 security hardware, zero-trust audits, and deal governance",
      parentId: "cat-008-cld",
    },
  ];

  for (const cat of categoriesData) {
    const catId = toUUID(cat.id);
    const parentId = cat.parentId ? toUUID(cat.parentId) : null;
    await prisma.category.upsert({
      where: { id: catId },
      update: {
        name: cat.name,
        description: cat.description,
        parentId,
      },
      create: {
        id: catId,
        name: cat.name,
        description: cat.description,
        parentId,
      },
    });
  }

  // =========================================================================
  // 3. PRODUCT CATALOG (20 B2B Products matching Q-1042 and DealFlow360)
  // =========================================================================
  console.log("Creating product catalog with INR pricing & GST...");

  const productsData = [
    // Canonical Q-1042 Line Items
    {
      id: "prod-0001-lp14",
      sku: "HW-LP14",
      name: "Enterprise Laptop Pro 14",
      description: "14-inch M-Pro workstation laptop, 32GB Unified Memory, 1TB SSD",
      categoryId: "cat-002-hw-laptops",
      unitPrice: "120000.00",
      costPrice: "69600.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    {
      id: "prod-0002-mig",
      sku: "SRV-MIG",
      name: "Enterprise Setup & Migration Services",
      description: "White-glove data transfer, tenant configuration, and SSO identity setup",
      categoryId: "cat-006-srv-deploy",
      unitPrice: "400000.00",
      costPrice: "288000.00",
      taxRate: "18.00",
      unit: "package",
      isActive: true,
    },
    {
      id: "prod-0003-dsp27",
      sku: "DSP27",
      name: "27-inch 4K Professional Studio Display",
      description: "Color-accurate 4K IPS display, 99% DCI-P3, USB-C 96W power delivery",
      categoryId: "cat-003-hw-displays",
      unitPrice: "65000.00",
      costPrice: "40300.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    // AI Recommendation Products from Approved UI
    {
      id: "prod-0004-tb4-dock",
      sku: "ACC-TB4-DK",
      name: "Universal Thunderbolt 4 Docking Station",
      description: "Dual 4K display output, 100W laptop charging, 2.5Gb Ethernet, 11 ports",
      categoryId: "cat-004-hw-accessories",
      unitPrice: "24000.00",
      costPrice: "15800.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    {
      id: "prod-0005-care3y",
      sku: "SVC-CARE3Y",
      name: "3-Year Enterprise Care Plan Pro",
      description: "Comprehensive hardware coverage, accidental damage, and 4-hour on-site SLA",
      categoryId: "cat-007-srv-support",
      unitPrice: "147000.00",
      costPrice: "49000.00",
      taxRate: "18.00",
      unit: "contract",
      isActive: true,
    },
    {
      id: "prod-0006-pwr100w",
      sku: "PWR-100W-2C",
      name: "100W USB-C Dual Rapid Power Adapter",
      description: "Gallium Nitride (GaN) dual USB-C rapid charger for mobile workstations",
      categoryId: "cat-004-hw-accessories",
      unitPrice: "7900.00",
      costPrice: "4500.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    // Additional Enterprise Hardware & Software
    {
      id: "prod-0007-lp16",
      sku: "HW-LP16",
      name: "Business Laptop Pro 16 Studio Edition",
      description: "16-inch workstation laptop, 64GB RAM, 2TB SSD, Liquid Retina XDR",
      categoryId: "cat-002-hw-laptops",
      unitPrice: "185000.00",
      costPrice: "111000.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    {
      id: "prod-0008-ws-tower",
      sku: "HW-WS-Z8",
      name: "Enterprise Tower Workstation Z8",
      description: "Rackable dual-socket Xeon workstation, 128GB ECC RAM, RTX A5000",
      categoryId: "cat-001-hw",
      unitPrice: "320000.00",
      costPrice: "192000.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    {
      id: "prod-0009-dsp34",
      sku: "HW-DSP34",
      name: "34-inch Curved UltraWide Professional Monitor",
      description: "UWQHD 3440x1440 IPS, 144Hz, USB-C Hub with KVM switch",
      categoryId: "cat-003-hw-displays",
      unitPrice: "95000.00",
      costPrice: "58900.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    {
      id: "prod-0010-sw-gov",
      sku: "SW-GOV-ENT",
      name: "DealFlow360 Enterprise Governance Suite (Named Seat)",
      description: "Automated commercial discount governance, approval chains, and real-time risk audit",
      categoryId: "cat-008-cld",
      unitPrice: "85000.00",
      costPrice: "17000.00",
      taxRate: "18.00",
      unit: "license",
      isActive: true,
    },
    {
      id: "prod-0011-sw-cld-mon",
      sku: "SW-CLD-MON",
      name: "Cloud Infrastructure Telemetry & Monitoring Agent",
      description: "Real-time cluster telemetry, distributed tracing, and compliance reporting agent",
      categoryId: "cat-008-cld",
      unitPrice: "36000.00",
      costPrice: "7200.00",
      taxRate: "18.00",
      unit: "node/yr",
      isActive: true,
    },
    {
      id: "prod-0012-sec-fido",
      sku: "SEC-FIDO2-KEY",
      name: "Enterprise FIDO2 Hardware Security Key (5-Pack)",
      description: "Hardware token for passwordless and zero-trust SSO authentication (USB-C/NFC)",
      categoryId: "cat-009-cld-sec",
      unitPrice: "15000.00",
      costPrice: "7500.00",
      taxRate: "18.00",
      unit: "pack",
      isActive: true,
    },
    {
      id: "prod-0013-sec-audit",
      sku: "SEC-AUDIT-ZT",
      name: "Zero-Trust Architecture & Security Assessment",
      description: "Comprehensive 2-week zero-trust readiness audit with CISO remediation report",
      categoryId: "cat-009-cld-sec",
      unitPrice: "250000.00",
      costPrice: "150000.00",
      taxRate: "18.00",
      unit: "engagement",
      isActive: true,
    },
    {
      id: "prod-0014-srv-sla-prem",
      sku: "SVC-SLA-PREM",
      name: "Enterprise SLA Support Agreement (1-Year 24/7)",
      description: "15-minute response time, dedicated named Technical Account Manager, quarterly business reviews",
      categoryId: "cat-007-srv-support",
      unitPrice: "600000.00",
      costPrice: "240000.00",
      taxRate: "18.00",
      unit: "year",
      isActive: true,
    },
    {
      id: "prod-0015-srv-arch",
      sku: "SVC-ARCH-CONS",
      name: "Enterprise Systems Architecture Advisory (40 Hrs)",
      description: "Principal solutions architect time for high-throughput pipeline and cloud design",
      categoryId: "cat-005-srv",
      unitPrice: "500000.00",
      costPrice: "300000.00",
      taxRate: "18.00",
      unit: "block",
      isActive: true,
    },
    {
      id: "prod-0016-srv-train",
      sku: "SVC-TRAIN-ON",
      name: "Custom On-Site Engineering Workshop & Training",
      description: "3-day on-site intensive workshop covering platform administration and workflow design",
      categoryId: "cat-005-srv",
      unitPrice: "180000.00",
      costPrice: "72000.00",
      taxRate: "18.00",
      unit: "session",
      isActive: true,
    },
    {
      id: "prod-0017-acc-kb-ms",
      sku: "ACC-KB-MS-PRO",
      name: "Wireless Ergonomic Keyboard & Precision Mouse Combo",
      description: "Split ergonomic design, multi-device Bluetooth pairing, rechargeable battery",
      categoryId: "cat-004-hw-accessories",
      unitPrice: "12000.00",
      costPrice: "6600.00",
      taxRate: "18.00",
      unit: "set",
      isActive: true,
    },
    {
      id: "prod-0018-acc-cable",
      sku: "ACC-CBL-TB4",
      name: "Thunderbolt 4 High-Speed Braided Cable (2-Meter)",
      description: "40Gbps data transfer, 100W Power Delivery, reinforced braided exterior",
      categoryId: "cat-004-hw-accessories",
      unitPrice: "4500.00",
      costPrice: "2000.00",
      taxRate: "18.00",
      unit: "unit",
      isActive: true,
    },
    {
      id: "prod-0019-hw-srv-r750",
      sku: "HW-SRV-R750",
      name: "2U Dual Xeon Scalable Enterprise Rack Server",
      description: "2U rack server, 2x Intel Xeon Gold 6330, 256GB RAM, 8x 3.84TB NVMe SSDs, Redundant PSU",
      categoryId: "cat-001-hw",
      unitPrice: "850000.00",
      costPrice: "552500.00",
      taxRate: "18.00",
      unit: "system",
      isActive: true,
    },
    {
      id: "prod-0020-sw-ai-opt",
      sku: "SW-AI-OPT",
      name: "AI Deal Governance & Margin Optimizer Module",
      description: "Predictive margin leak detection and automated multi-stage discount authorization plugin",
      categoryId: "cat-008-cld",
      unitPrice: "150000.00",
      costPrice: "30000.00",
      taxRate: "18.00",
      unit: "tenant/yr",
      isActive: true,
    },
  ];

  const seededProducts: Record<string, string> = {};

  for (const p of productsData) {
    const prodId = toUUID(p.id);
    const catId = toUUID(p.categoryId);
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        categoryId: catId,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
        taxRate: p.taxRate,
        unit: p.unit,
        isActive: p.isActive,
      },
      create: {
        id: prodId,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: catId,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
        taxRate: p.taxRate,
        unit: p.unit,
        isActive: p.isActive,
      },
    });
    seededProducts[p.sku] = prod.id;
  }

  // =========================================================================
  // 4. CUSTOMERS & CONTACTS (Enterprise Accounts with Tiers, Limits & Owners)
  // =========================================================================
  console.log("Creating enterprise customers and buyer contacts...");

  const customersData = [
    {
      id: "c-cust-0001-apex-infotech",
      name: "Apex Infotech Pvt. Ltd.",
      externalAccountId: "AC-88219",
      industry: "Enterprise Cloud & Infrastructure",
      tier: CustomerTier.GOLD,
      paymentTerms: "Net 45 Days",
      creditLimit: "25000000.00",
      creditAvailable: "18200000.00",
      territory: "South India (Bengaluru)",
      ownerEmail: "arjun.mehta@dealflow360.in",
      createdAt: new Date("2026-06-05T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0001-ananya-shah",
          name: "Ananya Shah",
          email: "ananya.shah@apexinfotech.example",
          phone: "+91 98201 55192",
          title: "VP Procurement",
          isPrimary: true,
          portalAccess: true,
          userId: seededUsers["ananya.shah@apexinfotech.example"],
        },
        {
          id: "cnt-0002-rohit-bansal",
          name: "Rohit Bansal",
          email: "rohit.bansal@apexinfotech.example",
          phone: "+91 98201 55195",
          title: "Senior Director IT Operations",
          isPrimary: false,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0002-bharatgrid",
      name: "BharatGrid Systems",
      externalAccountId: "NT-40291",
      industry: "Financial Technology & Trading",
      tier: CustomerTier.PLATINUM,
      paymentTerms: "Net 60 Days",
      creditLimit: "50000000.00",
      creditAvailable: "41550000.00",
      territory: "North India (Gurugram)",
      ownerEmail: "rohan.sharma@dealflow360.in",
      createdAt: new Date("2026-06-12T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0003-aditya-kulkarni",
          name: "Aditya Kulkarni",
          email: "a.kulkarni@bharatgrid.example",
          phone: "+91 98110 55182",
          title: "Chief Procurement Officer",
          isPrimary: true,
          portalAccess: true,
        },
      ],
    },
    {
      id: "c-cust-0003-novabyte",
      name: "NovaByte Technologies",
      externalAccountId: "GX-77218",
      industry: "Industrial Automation & Robotics",
      tier: CustomerTier.GOLD,
      paymentTerms: "Net 45 Days",
      creditLimit: "30000000.00",
      creditAvailable: "17400000.00",
      territory: "West India (Pune)",
      ownerEmail: "priya.nair@dealflow360.in",
      createdAt: new Date("2026-06-15T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0004-harish-somani",
          name: "Harish Somani",
          email: "h.somani@novabyte.example",
          phone: "+91 98220 55144",
          title: "VP Commercial Operations",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0004-indus-mfg",
      name: "Indus Manufacturing Group",
      externalAccountId: "OR-99120",
      industry: "Precision Engineering & Heavy Mfg",
      tier: CustomerTier.SILVER,
      paymentTerms: "Net 30 Days",
      creditLimit: "15000000.00",
      creditAvailable: "5360000.00",
      territory: "West India (Ahmedabad)",
      ownerEmail: "aditya.kulkarni@dealflow360.in",
      createdAt: new Date("2026-06-18T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0005-deepak-verma",
          name: "Deepak Verma",
          email: "d.verma@indusmfg.example",
          phone: "+91 98790 55133",
          title: "Supply Chain Lead",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0005-vistara-sol",
      name: "Vistara Industrial Solutions",
      externalAccountId: "NS-51204",
      industry: "Telecommunications & SatCom",
      tier: CustomerTier.GOLD,
      paymentTerms: "Net 45 Days",
      creditLimit: "20000000.00",
      creditAvailable: "13180000.00",
      territory: "West India (Mumbai)",
      ownerEmail: "arjun.mehta@dealflow360.in",
      createdAt: new Date("2026-06-25T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0006-sneha-iyer",
          name: "Sneha Iyer",
          email: "s.iyer@vistara.example",
          phone: "+91 98205 55111",
          title: "VP Infrastructure",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0006-meridian-dig",
      name: "Meridian Digital Services",
      externalAccountId: "HX-33104",
      industry: "Biomedical & Genomics",
      tier: CustomerTier.PLATINUM,
      paymentTerms: "Net 60 Days",
      creditLimit: "40000000.00",
      creditAvailable: "25800000.00",
      territory: "South India (Hyderabad)",
      ownerEmail: "priya.nair@dealflow360.in",
      createdAt: new Date("2026-07-01T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0007-dr-kavita-rao",
          name: "Dr. Kavita Rao",
          email: "k.rao@meridiandigital.example",
          phone: "+91 98490 55177",
          title: "Head of Genomic IT",
          isPrimary: true,
          portalAccess: true,
        },
      ],
    },
    {
      id: "c-cust-0007-shree-logistics",
      name: "Shree Logistics Systems",
      externalAccountId: "NW-18492",
      industry: "Global Logistics & Cold Chain",
      tier: CustomerTier.SILVER,
      paymentTerms: "Net 30 Days",
      creditLimit: "18000000.00",
      creditAvailable: "6500000.00",
      territory: "South India (Chennai)",
      ownerEmail: "rohan.sharma@dealflow360.in",
      createdAt: new Date("2026-07-05T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0008-saurabh-patil",
          name: "Saurabh Patil",
          email: "s.patil@shreelogistics.example",
          phone: "+91 98410 55199",
          title: "Director Global Sourcing",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0008-bluepeak-cloud",
      name: "BluePeak Cloud Services",
      externalAccountId: "VX-66190",
      industry: "Cybersecurity & Identity",
      tier: CustomerTier.BRONZE,
      paymentTerms: "Net 30 Days",
      creditLimit: "10000000.00",
      creditAvailable: "5720000.00",
      territory: "North India (Noida)",
      ownerEmail: "aditya.kulkarni@dealflow360.in",
      createdAt: new Date("2026-07-10T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0009-rahul-shinde",
          name: "Rahul Shinde",
          email: "r.shinde@bluepeak.example",
          phone: "+91 98100 55188",
          title: "IT Security Manager",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0009-konkan-eng",
      name: "Konkan Engineering Systems",
      externalAccountId: "AL-22194",
      industry: "Intermodal Freight & Port Mgmt",
      tier: CustomerTier.BRONZE,
      paymentTerms: "Net 30 Days",
      creditLimit: "10000000.00",
      creditAvailable: "4590000.00",
      territory: "West India (Mumbai)",
      ownerEmail: "arjun.mehta@dealflow360.in",
      createdAt: new Date("2026-07-15T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0010-nisha-agarwal",
          name: "Nisha Agarwal",
          email: "n.agarwal@konkaneng.example",
          phone: "+91 98200 55122",
          title: "Fleet Infrastructure Director",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0010-saffron-data",
      name: "Saffron Data Technologies",
      externalAccountId: "CA-99302",
      industry: "AI Edge Computing & Vision",
      tier: CustomerTier.SILVER,
      paymentTerms: "Net 30 Days",
      creditLimit: "15000000.00",
      creditAvailable: "11510000.00",
      territory: "South India (Bengaluru)",
      ownerEmail: "priya.nair@dealflow360.in",
      createdAt: new Date("2026-07-20T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0011-rajesh-madhav",
          name: "Rajesh Madhav",
          email: "r.madhav@saffrondatatech.example",
          phone: "+91 98450 55166",
          title: "Chief Technical Architect",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0011-vertex-ent",
      name: "Vertex Enterprise Networks",
      externalAccountId: "SD-44109",
      industry: "Aerospace & Satellite Platforms",
      tier: CustomerTier.PLATINUM,
      paymentTerms: "Net 60 Days",
      creditLimit: "60000000.00",
      creditAvailable: "39000000.00",
      territory: "North India (New Delhi)",
      ownerEmail: "rohan.sharma@dealflow360.in",
      createdAt: new Date("2026-07-22T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0012-vivek-dravid",
          name: "Vivek Dravid",
          email: "v.dravid@vertexnetworks.example",
          phone: "+91 98180 55155",
          title: "VP Propulsion Systems",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0012-orion-process",
      name: "Orion Process Automation",
      externalAccountId: "BI-11928",
      industry: "Pharmaceutical Clinical Trials",
      tier: CustomerTier.SILVER,
      paymentTerms: "Net 30 Days",
      creditLimit: "15000000.00",
      creditAvailable: "7570000.00",
      territory: "East India (Kolkata)",
      ownerEmail: "aditya.kulkarni@dealflow360.in",
      createdAt: new Date("2026-07-28T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0013-dr-amitava-sen",
          name: "Dr. Amitava Sen",
          email: "a.sen@orionprocess.example",
          phone: "+91 98300 55143",
          title: "Lab Informatics Director",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0013-trident-biz",
      name: "Trident Business Solutions",
      externalAccountId: "QD-77192",
      industry: "Autonomous Defense & Crypto",
      tier: CustomerTier.PLATINUM,
      paymentTerms: "Net 60 Days",
      creditLimit: "75000000.00",
      creditAvailable: "62000000.00",
      territory: "South India (Hyderabad)",
      ownerEmail: "arjun.mehta@dealflow360.in",
      createdAt: new Date("2026-08-01T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0014-karan-malhotra",
          name: "Karan Malhotra",
          email: "k.malhotra@tridentsolutions.example",
          phone: "+91 98499 55182",
          title: "Chief Cryptographer",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
    {
      id: "c-cust-0014-nextwave",
      name: "NextWave Enterprise Services",
      externalAccountId: "MH-88102",
      industry: "Hospital Systems & Telehealth",
      tier: CustomerTier.GOLD,
      paymentTerms: "Net 45 Days",
      creditLimit: "35000000.00",
      creditAvailable: "29000000.00",
      territory: "South India (Kochi)",
      ownerEmail: "priya.nair@dealflow360.in",
      createdAt: new Date("2026-08-05T09:00:00Z"),
      contacts: [
        {
          id: "cnt-0015-monica-joseph",
          name: "Monica Joseph",
          email: "m.joseph@nextwave.example",
          phone: "+91 98460 55139",
          title: "VP Clinical Operations",
          isPrimary: true,
          portalAccess: false,
        },
      ],
    },
  ];

  const seededCustomers: Record<string, string> = {};

  for (const c of customersData) {
    const ownerId = c.ownerEmail ? seededUsers[c.ownerEmail] : null;
    const custId = toUUID(c.id);

    const cust = await prisma.customer.upsert({
      where: { id: custId },
      update: {
        name: c.name,
        externalAccountId: c.externalAccountId,
        industry: c.industry,
        tier: c.tier,
        paymentTerms: c.paymentTerms,
        creditLimit: c.creditLimit,
        creditAvailable: c.creditAvailable,
        territory: c.territory,
        ownerId,
      },
      create: {
        id: custId,
        name: c.name,
        externalAccountId: c.externalAccountId,
        industry: c.industry,
        tier: c.tier,
        paymentTerms: c.paymentTerms,
        creditLimit: c.creditLimit,
        creditAvailable: c.creditAvailable,
        territory: c.territory,
        ownerId,
        createdAt: c.createdAt,
      },
    });
    seededCustomers[c.externalAccountId] = cust.id;

    // Create / update primary contacts
    for (const cnt of c.contacts) {
      const contactId = toUUID(cnt.id);
      await prisma.contact.upsert({
        where: { id: contactId },
        update: {
          name: cnt.name,
          email: cnt.email,
          phone: cnt.phone,
          title: cnt.title,
          isPrimary: cnt.isPrimary,
          portalAccess: cnt.portalAccess,
          userId: ('userId' in cnt && cnt.userId) ? cnt.userId : null,
        },
        create: {
          id: contactId,
          customerId: cust.id,
          userId: ('userId' in cnt && cnt.userId) ? cnt.userId : null,
          name: cnt.name,
          email: cnt.email,
          phone: cnt.phone,
          title: cnt.title,
          isPrimary: cnt.isPrimary,
          portalAccess: cnt.portalAccess,
        },
      });
    }
  }

  // =========================================================================
  // 5. PRICE LISTS & PRODUCT OVERRIDES (Standard, Enterprise, Gold)
  // =========================================================================
  console.log("Creating price lists and tier pricing rules...");

  const priceListsData = [
    {
      id: "pl-001-std",
      code: "STD-2026",
      name: "Standard India 2026",
      description: "Standard baseline pricing for general Indian commercial accounts",
      currency: "INR",
      tier: CustomerTier.BRONZE,
    },
    {
      id: "pl-002-ent",
      code: "ENT-2026",
      name: "Enterprise Volume India 2026",
      description: "Discounted commercial list for Silver tier accounts with volume agreements",
      currency: "INR",
      tier: CustomerTier.SILVER,
    },
    {
      id: "pl-003-gold",
      code: "GOLD-2026",
      name: "Gold Preferred India 2026",
      description: "Preferred strategic pricing for Gold & Platinum Indian accounts (matches Q-1042)",
      currency: "INR",
      tier: CustomerTier.GOLD,
    },
  ];

  for (const pl of priceListsData) {
    const plId = toUUID(pl.id);
    await prisma.priceList.upsert({
      where: { code: pl.code },
      update: {
        name: pl.name,
        description: pl.description,
        currency: pl.currency,
        tier: pl.tier,
      },
      create: {
        id: plId,
        code: pl.code,
        name: pl.name,
        description: pl.description,
        currency: pl.currency,
        tier: pl.tier,
      },
    });

    // Populate price list items for key products
    for (const p of productsData) {
      const prodId = toUUID(p.id);
      const baseNum = Number(p.unitPrice);
      // Enterprise is 5% lower; Gold is 10% lower (or exact Q-1042 prices)
      const multiplier = pl.code === "GOLD-2026" ? 0.90 : pl.code === "ENT-2026" ? 0.95 : 1.0;
      const customPrice = (baseNum * multiplier).toFixed(2);

      await prisma.priceListItem.upsert({
        where: {
          priceListId_productId: {
            priceListId: plId,
            productId: prodId,
          },
        },
        update: {
          price: customPrice,
        },
        create: {
          id: toUUID(`pli-${pl.id}-${p.sku.toLowerCase()}`),
          priceListId: plId,
          productId: prodId,
          price: customPrice,
        },
      });
    }
  }

  // =========================================================================
  // 6. DISCOUNT GOVERNANCE RULES (Thresholds & Authority Limits)
  // =========================================================================
  console.log("Creating discount governance rules...");

  const discountRulesData = [
    {
      id: "rule-001-rep-std",
      code: "RULE-REP-STD",
      name: "Standard Rep Delegated Authority",
      description: "Sales representatives can grant up to 15% discount on hardware without review",
      category: "Hardware",
      tier: CustomerTier.BRONZE,
      maxDiscountPercent: "15.00",
      requiredRole: "SALES_REP",
      requiresApproval: false,
    },
    {
      id: "rule-002-mgr-silver",
      code: "RULE-MGR-SILVER",
      name: "Sales Manager Review Threshold",
      description: "Discounts between 15.1% and 25% require Sales Manager review",
      category: "Hardware",
      tier: CustomerTier.SILVER,
      maxDiscountPercent: "25.00",
      requiredRole: "Sales Manager",
      requiresApproval: true,
    },
    {
      id: "rule-003-fin-srv",
      code: "RULE-FIN-SRV",
      name: "Services Discount Governance Ceiling",
      description: "Service lines have strict 10% ceiling; higher discounts trigger Finance Review (matches Q-1042)",
      category: "Services",
      tier: CustomerTier.GOLD,
      maxDiscountPercent: "10.00",
      requiredRole: "Finance Review",
      requiresApproval: true,
    },
    {
      id: "rule-004-exec-plat",
      code: "RULE-EXEC-PLAT",
      name: "Commercial Head Escalation",
      description: "Aggressive commercial packages exceeding 25% require VP Commercial sign-off",
      category: "Enterprise",
      tier: CustomerTier.PLATINUM,
      maxDiscountPercent: "35.00",
      requiredRole: "Commercial Head",
      requiresApproval: true,
    },
  ];

  for (const r of discountRulesData) {
    const ruleId = toUUID(r.id);
    await prisma.discountRule.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        code: r.code,
        description: r.description,
        category: r.category,
        tier: r.tier,
        maxDiscountPercent: r.maxDiscountPercent,
        requiredRole: r.requiredRole,
        requiresApproval: r.requiresApproval,
      },
      create: {
        id: ruleId,
        name: r.name,
        code: r.code,
        description: r.description,
        category: r.category,
        tier: r.tier,
        maxDiscountPercent: r.maxDiscountPercent,
        requiredRole: r.requiredRole,
        requiresApproval: r.requiresApproval,
      },
    });
  }

  // =========================================================================
  // 7. PRODUCT RECOMMENDATIONS (Approved UI Recommendations)
  // =========================================================================
  console.log("Creating AI product recommendations...");

  const recommendationsData = [
    {
      id: "rec-001-dock",
      sourceSku: "HW-LP14",
      targetSku: "ACC-TB4-DK",
      recommendationType: "CROSS_SELL",
      rationale: "Universal Thunderbolt 4 Docking Station (+₹24,000 unit, +38% gross margin)",
      confidenceScore: "0.94",
      estimatedMarginGain: "38.00",
    },
    {
      id: "rec-002-care",
      sourceSku: "HW-LP14",
      targetSku: "SVC-CARE3Y",
      recommendationType: "UPSELL",
      rationale: "3-Year Enterprise Care Plan Pro (+₹1,47,000 unit, +66% gross margin)",
      confidenceScore: "0.89",
      estimatedMarginGain: "66.00",
    },
    {
      id: "rec-003-pwr",
      sourceSku: "HW-LP14",
      targetSku: "PWR-100W-2C",
      recommendationType: "CROSS_SELL",
      rationale: "100W USB-C Dual Rapid Power Adapter (+₹7,900 unit, +43% gross margin)",
      confidenceScore: "0.81",
      estimatedMarginGain: "43.00",
    },
    {
      id: "rec-004-disp-dock",
      sourceSku: "DSP27",
      targetSku: "ACC-TB4-DK",
      recommendationType: "CROSS_SELL",
      rationale: "Pairs with 4K Studio Display for dual-monitor workstation setups",
      confidenceScore: "0.88",
      estimatedMarginGain: "38.00",
    },
  ];

  for (const rec of recommendationsData) {
    const srcId = seededProducts[rec.sourceSku];
    const tgtId = seededProducts[rec.targetSku];
    if (srcId && tgtId) {
      const recId = toUUID(rec.id);
      await prisma.productRecommendation.upsert({
        where: { id: recId },
        update: {
          sourceProductId: srcId,
          targetProductId: tgtId,
          recommendationType: rec.recommendationType,
          rationale: rec.rationale,
          confidenceScore: rec.confidenceScore,
          estimatedMarginGain: rec.estimatedMarginGain,
        },
        create: {
          id: recId,
          sourceProductId: srcId,
          targetProductId: tgtId,
          recommendationType: rec.recommendationType,
          rationale: rec.rationale,
          confidenceScore: rec.confidenceScore,
          estimatedMarginGain: rec.estimatedMarginGain,
        },
      });
    }
  }

  // =========================================================================
  // 8. WAREHOUSES & INVENTORY LEVELS (Indian Hubs & Split Fulfillment)
  // =========================================================================
  console.log("Creating Indian warehouses and inventory records...");

  const warehousesData = [
    {
      id: "wh-001-ind-west",
      code: "WH-MUM",
      name: "Mumbai Enterprise Hub",
      location: "Mumbai, Maharashtra",
      country: "India",
    },
    {
      id: "wh-002-ind-south",
      code: "WH-BLR",
      name: "Bengaluru Technology Hub",
      location: "Bengaluru, Karnataka",
      country: "India",
    },
    {
      id: "wh-003-ind-north",
      code: "WH-DEL",
      name: "Delhi NCR Fulfillment Centre",
      location: "Gurugram, Haryana",
      country: "India",
    },
  ];

  for (const wh of warehousesData) {
    const whId = toUUID(wh.id);
    await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: {
        name: wh.name,
        location: wh.location,
        country: wh.country,
      },
      create: {
        id: whId,
        code: wh.code,
        name: wh.name,
        location: wh.location,
        country: wh.country,
      },
    });
  }

  // Inventory distribution across warehouses:
  // - Laptop Pro 14: Mumbai 450 available (50 reserved); Bengaluru 0 (Demonstrates split fulfillment)
  // - 27" 4K Display: Bengaluru 320 available; Mumbai 12 (Bengaluru fulfills displays)
  // - Thunderbolt Dock: Mumbai 220; Bengaluru 180; Delhi NCR 95
  const inventoryData = [
    // Mumbai Enterprise Hub
    { warehouseId: "wh-001-ind-west", sku: "HW-LP14", onHand: 500, reserved: 50, available: 450, reorder: 50 },
    { warehouseId: "wh-001-ind-west", sku: "DSP27", onHand: 15, reserved: 3, available: 12, reorder: 20 },
    { warehouseId: "wh-001-ind-west", sku: "ACC-TB4-DK", onHand: 240, reserved: 20, available: 220, reorder: 30 },
    { warehouseId: "wh-001-ind-west", sku: "PWR-100W-2C", onHand: 850, reserved: 50, available: 800, reorder: 100 },
    { warehouseId: "wh-001-ind-west", sku: "HW-WS-Z8", onHand: 40, reserved: 5, available: 35, reorder: 10 },
    // Bengaluru Technology Hub
    { warehouseId: "wh-002-ind-south", sku: "HW-LP14", onHand: 0, reserved: 0, available: 0, reorder: 50 }, // Intentionally 0
    { warehouseId: "wh-002-ind-south", sku: "DSP27", onHand: 350, reserved: 30, available: 320, reorder: 40 },
    { warehouseId: "wh-002-ind-south", sku: "ACC-TB4-DK", onHand: 200, reserved: 20, available: 180, reorder: 30 },
    { warehouseId: "wh-002-ind-south", sku: "PWR-100W-2C", onHand: 650, reserved: 50, available: 600, reorder: 100 },
    { warehouseId: "wh-002-ind-south", sku: "HW-WS-Z8", onHand: 45, reserved: 5, available: 40, reorder: 10 },
    // Delhi NCR Fulfillment Centre
    { warehouseId: "wh-003-ind-north", sku: "HW-LP14", onHand: 180, reserved: 20, available: 160, reorder: 30 },
    { warehouseId: "wh-003-ind-north", sku: "DSP27", onHand: 90, reserved: 10, available: 80, reorder: 15 },
    { warehouseId: "wh-003-ind-north", sku: "ACC-TB4-DK", onHand: 110, reserved: 15, available: 95, reorder: 20 },
    { warehouseId: "wh-003-ind-north", sku: "HW-WS-Z8", onHand: 20, reserved: 5, available: 15, reorder: 5 },
  ];

  for (const inv of inventoryData) {
    const prodId = seededProducts[inv.sku];
    const whId = toUUID(inv.warehouseId);
    if (prodId) {
      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: whId,
            productId: prodId,
          },
        },
        update: {
          quantityOnHand: inv.onHand,
          quantityReserved: inv.reserved,
          quantityAvailable: inv.available,
          reorderPoint: inv.reorder,
        },
        create: {
          id: toUUID(`inv-${inv.warehouseId}-${inv.sku.toLowerCase()}`),
          warehouseId: whId,
          productId: prodId,
          quantityOnHand: inv.onHand,
          quantityReserved: inv.reserved,
          quantityAvailable: inv.available,
          reorderPoint: inv.reorder,
        },
      });
    }
  }

  // =========================================================================
  // 9. SUBSCRIPTION PLANS & CONTRACTS (Annual & Monthly SaaS in INR)
  // =========================================================================
  console.log("Creating subscription plans and active Indian contracts...");

  const plansData = [
    {
      id: "plan-001-gov-mo",
      code: "PLAN-GOV-M",
      name: "AI Deal Governance Suite (Monthly)",
      description: "Monthly subscription for automated discount governance, compliance audit, and margin analytics",
      interval: "MONTHLY",
      billingPrice: "65000.00",
      currency: "INR",
    },
    {
      id: "plan-002-gov-yr",
      code: "PLAN-GOV-A",
      name: "AI Deal Governance Suite (Annual)",
      description: "Annual commitment with enterprise multi-territory governance and SLA guarantee",
      interval: "ANNUAL",
      billingPrice: "720000.00",
      currency: "INR",
    },
    {
      id: "plan-003-mon-yr",
      code: "PLAN-MON-A",
      name: "Enterprise Cloud Monitoring Pro (Annual)",
      description: "Real-time telemetry, APM traces, and Kubernetes cluster health monitoring",
      interval: "ANNUAL",
      billingPrice: "480000.00",
      currency: "INR",
    },
    {
      id: "plan-004-sla-yr",
      code: "PLAN-SLA-A",
      name: "24/7 Dedicated Support SLA Agreement (Annual)",
      description: "Round-the-clock priority incident response with 15-minute engineer escalation",
      interval: "ANNUAL",
      billingPrice: "1200000.00",
      currency: "INR",
    },
  ];

  for (const pl of plansData) {
    const plId = toUUID(pl.id);
    await prisma.subscriptionPlan.upsert({
      where: { code: pl.code },
      update: {
        name: pl.name,
        description: pl.description,
        interval: pl.interval,
        billingPrice: pl.billingPrice,
        currency: pl.currency,
      },
      create: {
        id: plId,
        code: pl.code,
        name: pl.name,
        description: pl.description,
        interval: pl.interval,
        billingPrice: pl.billingPrice,
        currency: pl.currency,
      },
    });
  }

  // Active Subscriptions
  const subscriptionsData = [
    {
      id: "sub-0001-apex-mon",
      customerAccountId: "AC-88219",
      planCode: "PLAN-MON-A",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-06-05T00:00:00Z"),
      currentPeriodEnd: new Date("2027-06-05T00:00:00Z"),
      mrr: "40000.00",
      arr: "480000.00",
    },
    {
      id: "sub-0002-bharatgrid-gov",
      customerAccountId: "NT-40291",
      planCode: "PLAN-GOV-A",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-06-12T00:00:00Z"),
      currentPeriodEnd: new Date("2027-06-12T00:00:00Z"),
      mrr: "60000.00",
      arr: "720000.00",
    },
    {
      id: "sub-0003-meridian-sla",
      customerAccountId: "HX-33104",
      planCode: "PLAN-SLA-A",
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-07-01T00:00:00Z"),
      currentPeriodEnd: new Date("2027-07-01T00:00:00Z"),
      mrr: "100000.00",
      arr: "1200000.00",
    },
  ];

  for (const sub of subscriptionsData) {
    const custId = seededCustomers[sub.customerAccountId];
    const plan = plansData.find((p) => p.code === sub.planCode);

    if (custId && plan) {
      const subId = toUUID(sub.id);
      const planId = toUUID(plan.id);
      await prisma.subscription.upsert({
        where: { id: subId },
        update: {
          customerId: custId,
          planId: planId,
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          mrr: sub.mrr,
          arr: sub.arr,
        },
        create: {
          id: subId,
          customerId: custId,
          planId: planId,
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          mrr: sub.mrr,
          arr: sub.arr,
        },
      });
    }
  }

  // =========================================================================
  // 10. COMPREHENSIVE QUOTATIONS & APPROVAL WORKFLOWS (All 13 Quotations)
  // =========================================================================
  console.log("Creating 13 Indian quotations, line items, and approval chains in INR...");

  const now = new Date("2026-09-05T12:00:00Z");
  const dAgo = (days: number, hours = 0, mins = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours, d.getMinutes() - mins);
    return d;
  };

  interface SeedLineItemDef {
    id: string;
    productSku: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: string;
    discountPercent: string;
    discountLimitPercent: string;
    estimatedMarginPercent: string;
    lineTotal: string;
    governanceStatus: string;
  }

  interface SeedQuotationDef {
    id: string;
    quotationNumber: string;
    customerAccountId: string;
    ownerEmail: string;
    status: QuotationStatus;
    currentStage: string;
    subtotal: string;
    discountTotal: string;
    taxTotal: string;
    totalValue: string;
    estimatedMargin: string;
    riskScore: number;
    createdAt: Date;
    lineItems: SeedLineItemDef[];
    approval?: {
      id: string;
      status: ApprovalStatus;
      priority: ApprovalPriority;
      currentStep: number;
      requestedByEmail: string;
      assignedToEmail: string | null;
      submittedAt: Date;
      resolvedAt?: Date;
      steps: {
        id: string;
        stepOrder: number;
        role: string;
        approverEmail: string | null;
        status: WorkflowStepStatus;
        notes: string;
        completedAt?: Date;
      }[];
      history: {
        id: string;
        actorEmail: string;
        eventType: string;
        message: string;
        createdAt: Date;
      }[];
    };
  }

  const quotationsData: SeedQuotationDef[] = [
    // -----------------------------------------------------------------------
    // Q-1042: Primary UI Canonical Reference (Apex Infotech, High Risk 72, ₹18,30,000)
    // -----------------------------------------------------------------------
    {
      id: "q-1042-apex-infotech",
      quotationNumber: "Q-1042",
      customerAccountId: "AC-88219",
      ownerEmail: "arjun.mehta@dealflow360.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Finance Review",
      subtotal: "2025000.00",
      discountTotal: "342000.00",
      taxTotal: "147000.00",
      totalValue: "1830000.00",
      estimatedMargin: "36.00",
      riskScore: 72,
      createdAt: dAgo(1, 11, 45),
      lineItems: [
        {
          id: "qli-1042-1-laptop",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 10,
          unitPrice: "120000.00",
          discountPercent: "12.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "1056000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1042-2-migration",
          productSku: "SRV-MIG",
          productName: "Enterprise Setup & Migration Services",
          sku: "SRV-MIG",
          quantity: 1,
          unitPrice: "400000.00",
          discountPercent: "18.00",
          discountLimitPercent: "10.00",
          estimatedMarginPercent: "28.00",
          lineTotal: "328000.00",
          governanceStatus: "Over Limit (+8%)",
        },
        {
          id: "qli-1042-3-display",
          productSku: "DSP27",
          productName: "27-inch 4K Professional Studio Display",
          sku: "DSP27",
          quantity: 5,
          unitPrice: "65000.00",
          discountPercent: "8.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "38.00",
          lineTotal: "299000.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1042-apex",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.HIGH,
        currentStep: 2,
        requestedByEmail: "arjun.mehta@dealflow360.in",
        assignedToEmail: "meera.joshi@dealflow360.in",
        submittedAt: dAgo(1, 12, 2),
        steps: [
          {
            id: "step-1042-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "vikram.desai@dealflow360.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Auto-authorized within standard 15% delegated line limit.",
            completedAt: dAgo(1, 12, 5),
          },
          {
            id: "step-1042-2",
            stepOrder: 2,
            role: "Finance Review",
            approverEmail: "meera.joshi@dealflow360.in",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Triggered by service discount anomaly (>10% configured ceiling on SRV-MIG).",
          },
          {
            id: "step-1042-3",
            stepOrder: 3,
            role: "VP Commercial",
            approverEmail: "rajiv.menon@dealflow360.in",
            status: WorkflowStepStatus.PENDING,
            notes: "Commercial sign-off for blended margin below 40% target.",
          },
        ],
        history: [
          {
            id: "hist-1042-1",
            actorEmail: "arjun.mehta@dealflow360.in",
            eventType: "SUBMITTED",
            message: "Arjun Mehta submitted quote Q-1042 for approval review.",
            createdAt: dAgo(1, 12, 2),
          },
          {
            id: "hist-1042-2",
            actorEmail: "vikram.desai@dealflow360.in",
            eventType: "STEP_AUTO_APPROVED",
            message: "Step 1 (Sales Manager) auto-authorized under delegated threshold.",
            createdAt: dAgo(1, 12, 5),
          },
          {
            id: "hist-1042-3",
            actorEmail: "meera.joshi@dealflow360.in",
            eventType: "STEP_ASSIGNED",
            message: "Step 2 (Finance Review) assigned to Meera Joshi for service discount anomaly review.",
            createdAt: dAgo(1, 12, 6),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1048: Safe Auto-Approved Case (Shree Logistics, ₹1,15,00,000, Risk 28)
    // -----------------------------------------------------------------------
    {
      id: "q-1048-shree-logistics",
      quotationNumber: "Q-1048",
      customerAccountId: "NW-18492",
      ownerEmail: "rohan.sharma@dealflow360.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Order Created",
      subtotal: "12500000.00",
      discountTotal: "2250000.00",
      taxTotal: "1250000.00",
      totalValue: "11500000.00",
      estimatedMargin: "44.00",
      riskScore: 28,
      createdAt: dAgo(2, 4, 10),
      lineItems: [
        {
          id: "qli-1048-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 80,
          unitPrice: "120000.00",
          discountPercent: "10.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "8640000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1048-2",
          productSku: "DSP27",
          productName: "27-inch 4K Professional Studio Display",
          sku: "DSP27",
          quantity: 40,
          unitPrice: "65000.00",
          discountPercent: "10.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "38.00",
          lineTotal: "2340000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1048-3",
          productSku: "ACC-TB4-DK",
          productName: "Universal Thunderbolt 4 Docking Station",
          sku: "ACC-TB4-DK",
          quantity: 50,
          unitPrice: "24000.00",
          discountPercent: "5.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "36.00",
          lineTotal: "1140000.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1048-shree",
        status: ApprovalStatus.APPROVED,
        priority: ApprovalPriority.LOW,
        currentStep: 1,
        requestedByEmail: "rohan.sharma@dealflow360.in",
        assignedToEmail: "vikram.desai@dealflow360.in",
        submittedAt: dAgo(2, 4, 15),
        resolvedAt: dAgo(2, 4, 16),
        steps: [
          {
            id: "step-1048-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "vikram.desai@dealflow360.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Standard volume tier auto-authorized without manual escalation.",
            completedAt: dAgo(2, 4, 16),
          },
        ],
        history: [
          {
            id: "hist-1048-1",
            actorEmail: "rohan.sharma@dealflow360.in",
            eventType: "SUBMITTED",
            message: "Rohan Sharma submitted quote Q-1048 for review.",
            createdAt: dAgo(2, 4, 15),
          },
          {
            id: "hist-1048-2",
            actorEmail: "vikram.desai@dealflow360.in",
            eventType: "APPROVED",
            message: "Auto-approved within standard sales representative limits.",
            createdAt: dAgo(2, 4, 16),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1038: Fulfillment Split Case (NovaByte, ₹1,26,00,000, Risk 54)
    // -----------------------------------------------------------------------
    {
      id: "q-1038-novabyte",
      quotationNumber: "Q-1038",
      customerAccountId: "GX-77218",
      ownerEmail: "priya.nair@dealflow360.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Fulfillment Planning",
      subtotal: "14000000.00",
      discountTotal: "2800000.00",
      taxTotal: "1400000.00",
      totalValue: "12600000.00",
      estimatedMargin: "41.00",
      riskScore: 54,
      createdAt: dAgo(3, 8, 30),
      lineItems: [
        {
          id: "qli-1038-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 60,
          unitPrice: "120000.00",
          discountPercent: "14.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "6192000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1038-2",
          productSku: "DSP27",
          productName: "27-inch 4K Professional Studio Display",
          sku: "DSP27",
          quantity: 80,
          unitPrice: "65000.00",
          discountPercent: "12.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "38.00",
          lineTotal: "4576000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1038-3",
          productSku: "ACC-TB4-DK",
          productName: "Universal Thunderbolt 4 Docking Station",
          sku: "ACC-TB4-DK",
          quantity: 60,
          unitPrice: "24000.00",
          discountPercent: "8.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "36.00",
          lineTotal: "1324800.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1038-novabyte",
        status: ApprovalStatus.APPROVED,
        priority: ApprovalPriority.MEDIUM,
        currentStep: 1,
        requestedByEmail: "priya.nair@dealflow360.in",
        assignedToEmail: "vikram.desai@dealflow360.in",
        submittedAt: dAgo(3, 8, 35),
        resolvedAt: dAgo(3, 8, 40),
        steps: [
          {
            id: "step-1038-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "vikram.desai@dealflow360.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Multi-warehouse split allocation check across Mumbai and Bengaluru.",
            completedAt: dAgo(3, 8, 40),
          },
        ],
        history: [
          {
            id: "hist-1038-1",
            actorEmail: "priya.nair@dealflow360.in",
            eventType: "SUBMITTED",
            message: "Priya Nair submitted quote Q-1038 for fulfillment clearance.",
            createdAt: dAgo(3, 8, 35),
          },
          {
            id: "hist-1038-2",
            actorEmail: "vikram.desai@dealflow360.in",
            eventType: "APPROVED",
            message: "Sales management cleared fulfillment reservation across WH-MUM and WH-BLR.",
            createdAt: dAgo(3, 8, 40),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1045: Hybrid One-Time + Recurring Case (Meridian Digital, ₹1,42,00,000, Risk 61)
    // -----------------------------------------------------------------------
    {
      id: "q-1045-meridian-dig",
      quotationNumber: "Q-1045",
      customerAccountId: "HX-33104",
      ownerEmail: "priya.nair@dealflow360.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Contract Negotiation",
      subtotal: "16000000.00",
      discountTotal: "3400000.00",
      taxTotal: "1600000.00",
      totalValue: "14200000.00",
      estimatedMargin: "38.50",
      riskScore: 61,
      createdAt: dAgo(4, 3, 20),
      lineItems: [
        {
          id: "qli-1045-1",
          productSku: "HW-LP16",
          productName: "Business Laptop Pro 16 Studio Edition",
          sku: "HW-LP16",
          quantity: 40,
          unitPrice: "185000.00",
          discountPercent: "15.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "40.00",
          lineTotal: "6290000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1045-2",
          productSku: "SW-GOV-ENT",
          productName: "DealFlow360 Enterprise Governance Suite (Named Seat)",
          sku: "SW-GOV-ENT",
          quantity: 60,
          unitPrice: "85000.00",
          discountPercent: "20.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "68.00",
          lineTotal: "4080000.00",
          governanceStatus: "Over Limit (+5%)",
        },
        {
          id: "qli-1045-3",
          productSku: "SVC-SLA-PREM",
          productName: "Enterprise SLA Support Agreement (1-Year 24/7)",
          sku: "SVC-SLA-PREM",
          quantity: 2,
          unitPrice: "600000.00",
          discountPercent: "10.00",
          discountLimitPercent: "10.00",
          estimatedMarginPercent: "45.00",
          lineTotal: "1080000.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1045-meridian",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.MEDIUM,
        currentStep: 2,
        requestedByEmail: "priya.nair@dealflow360.in",
        assignedToEmail: "meera.joshi@dealflow360.in",
        submittedAt: dAgo(4, 3, 25),
        steps: [
          {
            id: "step-1045-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "vikram.desai@dealflow360.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Hybrid recurring contract pricing structure approved by sales head.",
            completedAt: dAgo(4, 3, 30),
          },
          {
            id: "step-1045-2",
            stepOrder: 2,
            role: "Finance Review",
            approverEmail: "meera.joshi@dealflow360.in",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Reviewing multi-year revenue recognition terms.",
          },
        ],
        history: [
          {
            id: "hist-1045-1",
            actorEmail: "priya.nair@dealflow360.in",
            eventType: "SUBMITTED",
            message: "Priya Nair submitted quote Q-1045 for hybrid recurring agreement review.",
            createdAt: dAgo(4, 3, 25),
          },
          {
            id: "hist-1045-2",
            actorEmail: "vikram.desai@dealflow360.in",
            eventType: "STEP_AUTO_APPROVED",
            message: "Step 1 approved. Advanced to Finance Review for billing structure approval.",
            createdAt: dAgo(4, 3, 30),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1052: High-Risk Executive Escalation (Vertex Enterprise, ₹2,10,00,000, Risk 78)
    // -----------------------------------------------------------------------
    {
      id: "q-1052-vertex-ent",
      quotationNumber: "Q-1052",
      customerAccountId: "SD-44109",
      ownerEmail: "rohan.sharma@dealflow360.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Executive Governance",
      subtotal: "25000000.00",
      discountTotal: "6500000.00",
      taxTotal: "2500000.00",
      totalValue: "21000000.00",
      estimatedMargin: "31.00",
      riskScore: 78,
      createdAt: dAgo(0, 5, 10),
      lineItems: [
        {
          id: "qli-1052-1",
          productSku: "HW-WS-Z8",
          productName: "Enterprise Tower Workstation Z8",
          sku: "HW-WS-Z8",
          quantity: 40,
          unitPrice: "320000.00",
          discountPercent: "22.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "33.00",
          lineTotal: "9984000.00",
          governanceStatus: "Over Limit (+7%)",
        },
        {
          id: "qli-1052-2",
          productSku: "HW-DSP34",
          productName: "34-inch Curved UltraWide Professional Monitor",
          sku: "HW-DSP34",
          quantity: 50,
          unitPrice: "95000.00",
          discountPercent: "20.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "32.00",
          lineTotal: "3800000.00",
          governanceStatus: "Over Limit (+5%)",
        },
        {
          id: "qli-1052-3",
          productSku: "SVC-ARCH-CONS",
          productName: "Enterprise Systems Architecture Advisory (40 Hrs)",
          sku: "SVC-ARCH-CONS",
          quantity: 4,
          unitPrice: "500000.00",
          discountPercent: "30.00",
          discountLimitPercent: "10.00",
          estimatedMarginPercent: "25.00",
          lineTotal: "1400000.00",
          governanceStatus: "Over Limit (+20%)",
        },
      ],
      approval: {
        id: "appr-1052-vertex",
        status: ApprovalStatus.ESCALATED,
        priority: ApprovalPriority.URGENT,
        currentStep: 3,
        requestedByEmail: "rohan.sharma@dealflow360.in",
        assignedToEmail: "rajiv.menon@dealflow360.in",
        submittedAt: dAgo(0, 5, 12),
        steps: [
          {
            id: "step-1052-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "vikram.desai@dealflow360.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Sales endorses account expansion for strategic aerospace division.",
            completedAt: dAgo(0, 5, 14),
          },
          {
            id: "step-1052-2",
            stepOrder: 2,
            role: "Finance Review",
            approverEmail: "meera.joshi@dealflow360.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Finance flagged margin compression below 35% target floor.",
            completedAt: dAgo(0, 5, 16),
          },
          {
            id: "step-1052-3",
            stepOrder: 3,
            role: "VP Commercial",
            approverEmail: "rajiv.menon@dealflow360.in",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Executive governance review required for deal >₹2 Cr with blended margin <35%.",
          },
        ],
        history: [
          {
            id: "hist-1052-1",
            actorEmail: "rohan.sharma@dealflow360.in",
            eventType: "SUBMITTED",
            message: "Rohan Sharma escalated high-value quote Q-1052 to executive board.",
            createdAt: dAgo(0, 5, 12),
          },
          {
            id: "hist-1052-2",
            actorEmail: "meera.joshi@dealflow360.in",
            eventType: "ESCALATED",
            message: "Escalated to Rajiv Menon (Commercial Head) due to margin floor policy violation.",
            createdAt: dAgo(0, 5, 16),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1022: Rejected Quotation (Orion Process, ₹74,30,000, Risk 64)
    // -----------------------------------------------------------------------
    {
      id: "q-1022-orion-process",
      quotationNumber: "Q-1022",
      customerAccountId: "BI-11928",
      ownerEmail: "aditya.kulkarni@dealflow360.in",
      status: QuotationStatus.REJECTED,
      currentStage: "Proposal Rejected",
      subtotal: "9500000.00",
      discountTotal: "3020000.00",
      taxTotal: "950000.00",
      totalValue: "7430000.00",
      estimatedMargin: "24.00",
      riskScore: 64,
      createdAt: dAgo(14, 2, 0),
      lineItems: [
        {
          id: "qli-1022-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 40,
          unitPrice: "120000.00",
          discountPercent: "28.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "24.00",
          lineTotal: "3456000.00",
          governanceStatus: "Over Limit (+13%)",
        },
      ],
      approval: {
        id: "appr-1022-orion",
        status: ApprovalStatus.REJECTED,
        priority: ApprovalPriority.HIGH,
        currentStep: 1,
        requestedByEmail: "aditya.kulkarni@dealflow360.in",
        assignedToEmail: "vikram.desai@dealflow360.in",
        submittedAt: dAgo(14, 2, 10),
        resolvedAt: dAgo(13, 2, 0),
        steps: [
          {
            id: "step-1022-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "vikram.desai@dealflow360.in",
            status: WorkflowStepStatus.REJECTED,
            notes: "Rejected: 28% discount requested on standard laptops without multi-year renewal.",
            completedAt: dAgo(13, 2, 0),
          },
        ],
        history: [
          {
            id: "hist-1022-1",
            actorEmail: "aditya.kulkarni@dealflow360.in",
            eventType: "SUBMITTED",
            message: "Aditya Kulkarni submitted quote Q-1022.",
            createdAt: dAgo(14, 2, 10),
          },
          {
            id: "hist-1022-2",
            actorEmail: "vikram.desai@dealflow360.in",
            eventType: "REJECTED",
            message: "Vikram Desai rejected quote Q-1022. Excess discount without term commitment.",
            createdAt: dAgo(13, 2, 0),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1050: Draft Case (Saffron Data, ₹34,90,000, Risk 18)
    // -----------------------------------------------------------------------
    {
      id: "q-1050-saffron-data",
      quotationNumber: "Q-1050",
      customerAccountId: "CA-99302",
      ownerEmail: "priya.nair@dealflow360.in",
      status: QuotationStatus.DRAFT,
      currentStage: "Drafting",
      subtotal: "3800000.00",
      discountTotal: "690000.00",
      taxTotal: "380000.00",
      totalValue: "3490000.00",
      estimatedMargin: "45.00",
      riskScore: 18,
      createdAt: dAgo(0, 1, 30),
      lineItems: [
        {
          id: "qli-1050-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 20,
          unitPrice: "120000.00",
          discountPercent: "5.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "45.00",
          lineTotal: "2280000.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1050-2",
          productSku: "DSP27",
          productName: "27-inch 4K Professional Studio Display",
          sku: "DSP27",
          quantity: 10,
          unitPrice: "65000.00",
          discountPercent: "5.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "40.00",
          lineTotal: "617500.00",
          governanceStatus: "Within Limit",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // Q-1018: Expired Case (BharatGrid, ₹1,62,50,000, Risk 30)
    // -----------------------------------------------------------------------
    {
      id: "q-1018-bharatgrid",
      quotationNumber: "Q-1018",
      customerAccountId: "NT-40291",
      ownerEmail: "rohan.sharma@dealflow360.in",
      status: QuotationStatus.EXPIRED,
      currentStage: "Validity Expired",
      subtotal: "18500000.00",
      discountTotal: "4100000.00",
      taxTotal: "1850000.00",
      totalValue: "16250000.00",
      estimatedMargin: "37.00",
      riskScore: 30,
      createdAt: dAgo(45, 0, 0),
      lineItems: [
        {
          id: "qli-1018-1",
          productSku: "HW-LP16",
          productName: "Business Laptop Pro 16 Studio Edition",
          sku: "HW-LP16",
          quantity: 50,
          unitPrice: "185000.00",
          discountPercent: "12.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "8140000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // Additional Active Quotations across Indian Accounts
    // -----------------------------------------------------------------------
    {
      id: "q-1041-bharatgrid",
      quotationNumber: "Q-1041",
      customerAccountId: "NT-40291",
      ownerEmail: "rohan.sharma@dealflow360.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Order Created",
      subtotal: "9600000.00",
      discountTotal: "2110000.00",
      taxTotal: "960000.00",
      totalValue: "8450000.00",
      estimatedMargin: "43.00",
      riskScore: 32,
      createdAt: dAgo(5, 2, 0),
      lineItems: [
        {
          id: "qli-1041-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 50,
          unitPrice: "120000.00",
          discountPercent: "10.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "5400000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },
    {
      id: "q-1035-indus-mfg",
      quotationNumber: "Q-1035",
      customerAccountId: "OR-99120",
      ownerEmail: "aditya.kulkarni@dealflow360.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Fulfillment Planning",
      subtotal: "4800000.00",
      discountTotal: "1000000.00",
      taxTotal: "480000.00",
      totalValue: "4280000.00",
      estimatedMargin: "42.50",
      riskScore: 25,
      createdAt: dAgo(7, 4, 15),
      lineItems: [
        {
          id: "qli-1035-1",
          productSku: "DSP27",
          productName: "27-inch 4K Professional Studio Display",
          sku: "DSP27",
          quantity: 40,
          unitPrice: "65000.00",
          discountPercent: "10.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "38.00",
          lineTotal: "2340000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },
    {
      id: "q-1029-indus-mfg",
      quotationNumber: "Q-1029",
      customerAccountId: "OR-99120",
      ownerEmail: "aditya.kulkarni@dealflow360.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Order Created",
      subtotal: "11000000.00",
      discountTotal: "2460000.00",
      taxTotal: "1100000.00",
      totalValue: "9640000.00",
      estimatedMargin: "44.00",
      riskScore: 29,
      createdAt: dAgo(10, 1, 0),
      lineItems: [
        {
          id: "qli-1029-1",
          productSku: "HW-WS-Z8",
          productName: "Enterprise Tower Workstation Z8",
          sku: "HW-WS-Z8",
          quantity: 20,
          unitPrice: "320000.00",
          discountPercent: "12.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "38.00",
          lineTotal: "5632000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },
    {
      id: "q-1031-konkan-eng",
      quotationNumber: "Q-1031",
      customerAccountId: "AL-22194",
      ownerEmail: "arjun.mehta@dealflow360.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Sales Review",
      subtotal: "7800000.00",
      discountTotal: "1760000.00",
      taxTotal: "780000.00",
      totalValue: "6820000.00",
      estimatedMargin: "39.00",
      riskScore: 48,
      createdAt: dAgo(6, 3, 40),
      lineItems: [
        {
          id: "qli-1031-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 40,
          unitPrice: "120000.00",
          discountPercent: "14.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "4128000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },
    {
      id: "q-1037-konkan-eng",
      quotationNumber: "Q-1037",
      customerAccountId: "AL-22194",
      ownerEmail: "arjun.mehta@dealflow360.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Fulfillment Planning",
      subtotal: "6000000.00",
      discountTotal: "1190000.00",
      taxTotal: "600000.00",
      totalValue: "5410000.00",
      estimatedMargin: "41.00",
      riskScore: 34,
      createdAt: dAgo(8, 5, 0),
      lineItems: [
        {
          id: "qli-1037-1",
          productSku: "HW-LP14",
          productName: "Enterprise Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 30,
          unitPrice: "120000.00",
          discountPercent: "8.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "3312000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },
  ];

  let totalLineItems = 0;
  let totalApprovals = 0;
  let totalWorkflowSteps = 0;
  let totalHistoryEvents = 0;

  for (const qDef of quotationsData) {
    const customerId = seededCustomers[qDef.customerAccountId];
    const ownerId = seededUsers[qDef.ownerEmail];

    if (!customerId || !ownerId) {
      console.warn(`Skipping quote ${qDef.quotationNumber} due to missing customer or owner.`);
      continue;
    }

    const quotation = await prisma.quotation.upsert({
      where: { quotationNumber: qDef.quotationNumber },
      update: {
        customerId,
        ownerId,
        status: qDef.status,
        currentStage: qDef.currentStage,
        currency: "INR",
        subtotal: qDef.subtotal,
        discountTotal: qDef.discountTotal,
        taxTotal: qDef.taxTotal,
        totalValue: qDef.totalValue,
        estimatedMargin: qDef.estimatedMargin,
        riskScore: qDef.riskScore,
        createdAt: qDef.createdAt,
      },
      create: {
        id: toUUID(qDef.id),
        quotationNumber: qDef.quotationNumber,
        customerId,
        ownerId,
        status: qDef.status,
        currentStage: qDef.currentStage,
        currency: "INR",
        subtotal: qDef.subtotal,
        discountTotal: qDef.discountTotal,
        taxTotal: qDef.taxTotal,
        totalValue: qDef.totalValue,
        estimatedMargin: qDef.estimatedMargin,
        riskScore: qDef.riskScore,
        createdAt: qDef.createdAt,
      },
    });

    // Seed Quote Line Items linked to catalog products
    for (const li of qDef.lineItems) {
      const prodId = seededProducts[li.productSku];
      const lineItemId = toUUID(li.id);

      await prisma.quoteLineItem.upsert({
        where: { id: lineItemId },
        update: {
          quotationId: quotation.id,
          productId: prodId ?? null,
          productName: li.productName,
          sku: li.sku,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discountPercent: li.discountPercent,
          discountLimitPercent: li.discountLimitPercent,
          estimatedMarginPercent: li.estimatedMarginPercent,
          lineTotal: li.lineTotal,
          governanceStatus: li.governanceStatus,
        },
        create: {
          id: lineItemId,
          quotationId: quotation.id,
          productId: prodId ?? null,
          productName: li.productName,
          sku: li.sku,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discountPercent: li.discountPercent,
          discountLimitPercent: li.discountLimitPercent,
          estimatedMarginPercent: li.estimatedMarginPercent,
          lineTotal: li.lineTotal,
          governanceStatus: li.governanceStatus,
        },
      });
      totalLineItems++;
    }

    // Seed Approval & Workflow if defined
    if (qDef.approval) {
      const requestedById = seededUsers[qDef.approval.requestedByEmail] || ownerId;
      const assignedToId = qDef.approval.assignedToEmail ? seededUsers[qDef.approval.assignedToEmail] : null;
      const approvalId = toUUID(qDef.approval.id);

      const approval = await prisma.approval.upsert({
        where: { id: approvalId },
        update: {
          quotationId: quotation.id,
          status: qDef.approval.status,
          priority: qDef.approval.priority,
          currentStep: qDef.approval.currentStep,
          requestedById,
          assignedToId,
          submittedAt: qDef.approval.submittedAt,
          resolvedAt: qDef.approval.resolvedAt ?? null,
        },
        create: {
          id: approvalId,
          quotationId: quotation.id,
          status: qDef.approval.status,
          priority: qDef.approval.priority,
          currentStep: qDef.approval.currentStep,
          requestedById,
          assignedToId,
          submittedAt: qDef.approval.submittedAt,
          resolvedAt: qDef.approval.resolvedAt ?? null,
        },
      });
      totalApprovals++;

      // Workflow Steps
      for (const st of qDef.approval.steps) {
        const approverId = st.approverEmail ? seededUsers[st.approverEmail] : null;
        const stepId = toUUID(st.id);

        await prisma.approvalWorkflowStep.upsert({
          where: { id: stepId },
          update: {
            approvalId: approval.id,
            stepOrder: st.stepOrder,
            role: st.role,
            approverId,
            status: st.status,
            notes: st.notes,
            completedAt: st.completedAt ?? null,
          },
          create: {
            id: stepId,
            approvalId: approval.id,
            stepOrder: st.stepOrder,
            role: st.role,
            approverId,
            status: st.status,
            notes: st.notes,
            completedAt: st.completedAt ?? null,
          },
        });
        totalWorkflowSteps++;
      }

      // History
      for (const h of qDef.approval.history) {
        const actorId = seededUsers[h.actorEmail] || ownerId;
        const histId = toUUID(h.id);

        await prisma.approvalHistory.upsert({
          where: { id: histId },
          update: {
            approvalId: approval.id,
            actorId,
            eventType: h.eventType,
            message: h.message,
            createdAt: h.createdAt,
          },
          create: {
            id: histId,
            approvalId: approval.id,
            actorId,
            eventType: h.eventType,
            message: h.message,
            createdAt: h.createdAt,
          },
        });
        totalHistoryEvents++;
      }
    }
  }

  console.log("=========================================================================");
  console.log("✅ DealFlow360 India-First Enterprise Seed Completed Successfully!");
  console.log(`   - Users:              ${usersData.length}`);
  console.log(`   - Categories:         ${categoriesData.length}`);
  console.log(`   - Products:           ${productsData.length}`);
  console.log(`   - Customers:          ${customersData.length}`);
  console.log(`   - Price Lists:        ${priceListsData.length}`);
  console.log(`   - Discount Rules:     ${discountRulesData.length}`);
  console.log(`   - Recommendations:    ${recommendationsData.length}`);
  console.log(`   - Warehouses:         ${warehousesData.length}`);
  console.log(`   - Inventory Items:    ${inventoryData.length}`);
  console.log(`   - Subscription Plans: ${plansData.length}`);
  console.log(`   - Subscriptions:      ${subscriptionsData.length}`);
  console.log(`   - Quotations:         ${quotationsData.length}`);
  console.log(`   - Quote Line Items:   ${totalLineItems}`);
  console.log(`   - Approvals:          ${totalApprovals}`);
  console.log(`   - Workflow Steps:     ${totalWorkflowSteps}`);
  console.log(`   - History Records:    ${totalHistoryEvents}`);
  console.log("=========================================================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
