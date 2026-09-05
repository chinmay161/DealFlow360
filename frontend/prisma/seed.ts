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
  QuotationStatus,
  ApprovalStatus,
  ApprovalPriority,
  WorkflowStepStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting DealFlow360 database seeding...");

  // =========================================================================
  // 1. USERS (Deterministic Identifiers & Canonical Roles)
  // =========================================================================
  console.log("Creating seed users...");

  const usersData = [
    {
      id: "u-usr-0001-james-carter",
      name: "James Carter",
      email: "james.carter@ves.ac.in",
      role: UserRole.SALES_REP,
      avatarUrl: "/james-carter.jpg",
      createdAt: new Date("2026-06-01T08:00:00Z"),
    },
    {
      id: "u-usr-0002-marcus-vance",
      name: "Marcus Vance",
      email: "marcus.vance@odoo.com",
      role: UserRole.APPROVER,
      avatarUrl: null,
      createdAt: new Date("2026-06-01T08:00:00Z"),
    },
    {
      id: "u-usr-0003-elena-rostova",
      name: "Elena Rostova",
      email: "elena.rostova@odoo.com",
      role: UserRole.APPROVER,
      avatarUrl: null,
      createdAt: new Date("2026-06-01T08:00:00Z"),
    },
    {
      id: "u-usr-0004-david-vance",
      name: "David Vance",
      email: "david.vance@ves.ac.in",
      role: UserRole.SALES_REP,
      avatarUrl: null,
      createdAt: new Date("2026-06-10T08:00:00Z"),
    },
    {
      id: "u-usr-0005-rachel-kim",
      name: "Rachel Kim",
      email: "rachel.kim@ves.ac.in",
      role: UserRole.SALES_REP,
      avatarUrl: null,
      createdAt: new Date("2026-06-15T08:00:00Z"),
    },
    {
      id: "u-usr-0006-marcus-miller",
      name: "Marcus Miller",
      email: "marcus.miller@ves.ac.in",
      role: UserRole.SALES_REP,
      avatarUrl: null,
      createdAt: new Date("2026-06-20T08:00:00Z"),
    },
    {
      id: "u-usr-0007-sarah-chen",
      name: "Sarah Chen",
      email: "sarah.chen@gmail.com",
      role: UserRole.ADMIN,
      avatarUrl: null,
      createdAt: new Date("2026-05-15T08:00:00Z"),
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
        id: u.id,
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
  // 2. CUSTOMERS (Realistic Enterprise B2B Accounts)
  // =========================================================================
  console.log("Creating seed customers...");

  const customersData = [
    {
      id: "c-cust-0001-acme-corp",
      name: "Acme Corporation",
      externalAccountId: "AC-88219",
      industry: "Enterprise Cloud & Infrastructure",
      createdAt: new Date("2026-06-05T09:00:00Z"),
    },
    {
      id: "c-cust-0002-northstar-tech",
      name: "Northstar Technologies",
      externalAccountId: "NT-40291",
      industry: "Financial Technology & Trading",
      createdAt: new Date("2026-06-12T09:00:00Z"),
    },
    {
      id: "c-cust-0003-globex-ind",
      name: "Globex Industries",
      externalAccountId: "GX-77218",
      industry: "Industrial Automation & Robotics",
      createdAt: new Date("2026-06-15T09:00:00Z"),
    },
    {
      id: "c-cust-0004-orion-mfg",
      name: "Orion Manufacturing",
      externalAccountId: "OR-99120",
      industry: "Precision Engineering & Heavy Mfg",
      createdAt: new Date("2026-06-18T09:00:00Z"),
    },
    {
      id: "c-cust-0005-nova-systems",
      name: "Nova Systems",
      externalAccountId: "NS-51204",
      industry: "Telecommunications & SatCom",
      createdAt: new Date("2026-06-25T09:00:00Z"),
    },
    {
      id: "c-cust-0006-helix-systems",
      name: "Helix Systems",
      externalAccountId: "HX-33104",
      industry: "Biomedical & Genomics",
      createdAt: new Date("2026-07-01T09:00:00Z"),
    },
    {
      id: "c-cust-0007-northwind-sol",
      name: "Northwind Solutions",
      externalAccountId: "NW-18492",
      industry: "Global Logistics & Cold Chain",
      createdAt: new Date("2026-07-05T09:00:00Z"),
    },
    {
      id: "c-cust-0008-vertex-sol",
      name: "Vertex Solutions",
      externalAccountId: "VX-66190",
      industry: "Cybersecurity & Identity",
      createdAt: new Date("2026-07-10T09:00:00Z"),
    },
    {
      id: "c-cust-0009-apex-logistics",
      name: "Apex Logistics",
      externalAccountId: "AL-22194",
      industry: "Intermodal Freight & Port Mgmt",
      createdAt: new Date("2026-07-15T09:00:00Z"),
    },
    {
      id: "c-cust-0010-cyberdyne",
      name: "Cyberdyne Analytics",
      externalAccountId: "CA-99302",
      industry: "AI Edge Computing & Vision",
      createdAt: new Date("2026-07-20T09:00:00Z"),
    },
    {
      id: "c-cust-0011-stellar-dyn",
      name: "Stellar Dynamics",
      externalAccountId: "SD-44109",
      industry: "Aerospace & Satellite Platforms",
      createdAt: new Date("2026-07-22T09:00:00Z"),
    },
    {
      id: "c-cust-0012-biotech-inno",
      name: "BioTech Innovations",
      externalAccountId: "BI-11928",
      industry: "Pharmaceutical Clinical Trials",
      createdAt: new Date("2026-07-28T09:00:00Z"),
    },
  ];

  const seededCustomers: Record<string, string> = {};

  for (const c of customersData) {
    const cust = await prisma.customer.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        externalAccountId: c.externalAccountId,
        industry: c.industry,
      },
      create: {
        id: c.id,
        name: c.name,
        externalAccountId: c.externalAccountId,
        industry: c.industry,
        createdAt: c.createdAt,
      },
    });
    seededCustomers[c.externalAccountId] = cust.id;
  }

  // =========================================================================
  // 3. QUOTATIONS, LINE ITEMS, APPROVALS & WORKFLOWS
  // =========================================================================
  console.log("Creating quotations, line items, and approval governance records...");

  // Helper date generators for deterministic timeline over past 30-90 days
  const dAgo = (days: number, hours = 10, minutes = 0) => {
    // Relative to September 5, 2026
    const base = new Date("2026-09-05T00:00:00Z");
    base.setDate(base.getDate() - days);
    base.setHours(hours, minutes, 0, 0);
    return base;
  };

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
    lineItems: Array<{
      id: string;
      productName: string;
      sku: string;
      quantity: number;
      unitPrice: string;
      discountPercent: string;
      discountLimitPercent: string;
      estimatedMarginPercent: string;
      lineTotal: string;
      governanceStatus: string;
    }>;
    approval?: {
      id: string;
      status: ApprovalStatus;
      priority: ApprovalPriority;
      currentStep: number;
      requestedByEmail: string;
      assignedToEmail?: string;
      submittedAt: Date;
      resolvedAt?: Date;
      steps: Array<{
        id: string;
        stepOrder: number;
        role: string;
        approverEmail?: string;
        status: WorkflowStepStatus;
        notes?: string;
        completedAt?: Date;
      }>;
      history: Array<{
        id: string;
        actorEmail?: string;
        eventType: string;
        message: string;
        createdAt: Date;
      }>;
    };
  }

  const quotationsData: SeedQuotationDef[] = [
    // -----------------------------------------------------------------------
    // Q-1042: Primary UI Canonical Reference (Acme Corporation, High Risk, $18,300)
    // -----------------------------------------------------------------------
    {
      id: "q-1042-acme-corp",
      quotationNumber: "Q-1042",
      customerAccountId: "AC-88219",
      ownerEmail: "james.carter@ves.ac.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Finance Review",
      subtotal: "20250.00",
      discountTotal: "3420.00",
      taxTotal: "1470.00",
      totalValue: "18300.00",
      estimatedMargin: "36.00",
      riskScore: 72,
      createdAt: dAgo(1, 11, 45),
      lineItems: [
        {
          id: "qli-1042-1-laptop",
          productName: "Laptop Pro 14",
          sku: "HW-LP14",
          quantity: 10,
          unitPrice: "1200.00",
          discountPercent: "12.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "42.00",
          lineTotal: "10560.00",
          governanceStatus: "Within Limit",
        },
        {
          id: "qli-1042-2-migration",
          productName: "Enterprise Setup & Migration",
          sku: "SRV-MIG",
          quantity: 1,
          unitPrice: "4000.00",
          discountPercent: "18.00",
          discountLimitPercent: "10.00",
          estimatedMarginPercent: "28.00",
          lineTotal: "3280.00",
          governanceStatus: "Over Limit (+8%)",
        },
        {
          id: "qli-1042-3-display",
          productName: "27-inch 4K Studio Display",
          sku: "DSP27",
          quantity: 5,
          unitPrice: "650.00",
          discountPercent: "8.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "38.00",
          lineTotal: "2990.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1042-acme",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.HIGH,
        currentStep: 2,
        requestedByEmail: "james.carter@ves.ac.in",
        assignedToEmail: "marcus.vance@odoo.com",
        submittedAt: dAgo(1, 12, 2),
        steps: [
          {
            id: "step-1042-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "james.carter@ves.ac.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Auto-authorized within delegated threshold (15%)",
            completedAt: dAgo(1, 12, 5),
          },
          {
            id: "step-1042-2",
            stepOrder: 2,
            role: "Finance Review",
            approverEmail: "marcus.vance@odoo.com",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Triggered by service discount anomaly (>10%) on SRV-MIG",
          },
          {
            id: "step-1042-3",
            stepOrder: 3,
            role: "VP Commercial",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.PENDING,
            notes: "Only triggered if required after finance review",
          },
        ],
        history: [
          {
            id: "hist-1042-1",
            actorEmail: "james.carter@ves.ac.in",
            eventType: "UPDATED",
            message: "Quote Q-1042 draft created and updated.",
            createdAt: dAgo(1, 11, 57),
          },
          {
            id: "hist-1042-2",
            actorEmail: undefined,
            eventType: "EXCEPTION",
            message: "Risk engine detected discount governance exception on SRV-MIG (18% vs 10% limit).",
            createdAt: dAgo(1, 11, 58),
          },
          {
            id: "hist-1042-3",
            actorEmail: "james.carter@ves.ac.in",
            eventType: "SUBMITTED",
            message: "James Carter submitted the quotation for multi-tier approval.",
            createdAt: dAgo(1, 12, 2),
          },
          {
            id: "hist-1042-4",
            actorEmail: "james.carter@ves.ac.in",
            eventType: "APPROVED",
            message: "Step 1 (Sales Manager) auto-authorized.",
            createdAt: dAgo(1, 12, 5),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1029: Orion Manufacturing ($96,400, Commercial Review, High Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1029-orion-mfg",
      quotationNumber: "Q-1029",
      customerAccountId: "OR-99120",
      ownerEmail: "david.vance@ves.ac.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Commercial Review",
      subtotal: "118500.00",
      discountTotal: "29900.00",
      taxTotal: "7800.00",
      totalValue: "96400.00",
      estimatedMargin: "24.00",
      riskScore: 68,
      createdAt: dAgo(2, 11, 15),
      lineItems: [
        {
          id: "qli-1029-1-iot",
          productName: "Industrial Sensor Array Hub",
          sku: "IOT-HUB",
          quantity: 20,
          unitPrice: "3500.00",
          discountPercent: "25.00",
          discountLimitPercent: "20.00",
          estimatedMarginPercent: "22.00",
          lineTotal: "52500.00",
          governanceStatus: "Over Limit (+5%)",
        },
        {
          id: "qli-1029-2-server",
          productName: "Telemetry Analytics Server Tier 2",
          sku: "SRV-TLM",
          quantity: 4,
          unitPrice: "8000.00",
          discountPercent: "20.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "26.00",
          lineTotal: "25600.00",
          governanceStatus: "Over Limit (+5%)",
        },
        {
          id: "qli-1029-3-sla",
          productName: "24/7 Mission Critical Support SLA",
          sku: "SLA-MC",
          quantity: 1,
          unitPrice: "16500.00",
          discountPercent: "36.36",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "25.00",
          lineTotal: "10500.00",
          governanceStatus: "Over Limit (+21%)",
        },
      ],
      approval: {
        id: "appr-1029-orion",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.HIGH,
        currentStep: 2,
        requestedByEmail: "david.vance@ves.ac.in",
        assignedToEmail: "elena.rostova@odoo.com",
        submittedAt: dAgo(2, 11, 46),
        steps: [
          {
            id: "step-1029-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "james.carter@ves.ac.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Sales endorsement granted.",
            completedAt: dAgo(2, 11, 50),
          },
          {
            id: "step-1029-2",
            stepOrder: 2,
            role: "Commercial Review",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Margin threshold violation review (24% vs 30% target)",
          },
          {
            id: "step-1029-3",
            stepOrder: 3,
            role: "VP Finance",
            approverEmail: "marcus.vance@odoo.com",
            status: WorkflowStepStatus.PENDING,
          },
        ],
        history: [
          {
            id: "hist-1029-1",
            actorEmail: "david.vance@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for commercial approval with Net 90 payment exception.",
            createdAt: dAgo(2, 11, 46),
          },
          {
            id: "hist-1029-2",
            actorEmail: "james.carter@ves.ac.in",
            eventType: "APPROVED",
            message: "Step 1 (Sales Manager) authorized.",
            createdAt: dAgo(2, 11, 50),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1045: Helix Systems ($142,000, Finance Review, High Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1045-helix",
      quotationNumber: "Q-1045",
      customerAccountId: "HX-33104",
      ownerEmail: "rachel.kim@ves.ac.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Finance Review",
      subtotal: "182000.00",
      discountTotal: "51200.00",
      taxTotal: "11200.00",
      totalValue: "142000.00",
      estimatedMargin: "32.00",
      riskScore: 61,
      createdAt: dAgo(3, 10, 0),
      lineItems: [
        {
          id: "qli-1045-1-sequencer",
          productName: "High-Throughput Sequencer Controller",
          sku: "BIO-SEQ",
          quantity: 2,
          unitPrice: "65000.00",
          discountPercent: "28.00",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "31.00",
          lineTotal: "93600.00",
          governanceStatus: "Over Limit (+13%)",
        },
        {
          id: "qli-1045-2-compute",
          productName: "BioCompute Rack Node",
          sku: "COMP-RACK",
          quantity: 4,
          unitPrice: "13000.00",
          discountPercent: "28.46",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "34.00",
          lineTotal: "37200.00",
          governanceStatus: "Over Limit (+13%)",
        },
      ],
      approval: {
        id: "appr-1045-helix",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.HIGH,
        currentStep: 2,
        requestedByEmail: "rachel.kim@ves.ac.in",
        assignedToEmail: "marcus.vance@odoo.com",
        submittedAt: dAgo(3, 11, 14),
        steps: [
          {
            id: "step-1045-1",
            stepOrder: 1,
            role: "Sales Director",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.APPROVED,
            completedAt: dAgo(3, 11, 30),
          },
          {
            id: "step-1045-2",
            stepOrder: 2,
            role: "Finance Review",
            approverEmail: "marcus.vance@odoo.com",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Hardware tier discount escalation triggered (28% vs 15% cap)",
          },
        ],
        history: [
          {
            id: "hist-1045-1",
            actorEmail: "rachel.kim@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Hardware volume discount exceeded review submitted.",
            createdAt: dAgo(3, 11, 14),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1038: Globex Industries ($126,000, Sales Review, Medium Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1038-globex",
      quotationNumber: "Q-1038",
      customerAccountId: "GX-77218",
      ownerEmail: "marcus.miller@ves.ac.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Sales Review",
      subtotal: "150000.00",
      discountTotal: "34000.00",
      taxTotal: "10000.00",
      totalValue: "126000.00",
      estimatedMargin: "41.00",
      riskScore: 54,
      createdAt: dAgo(4, 9, 30),
      lineItems: [
        {
          id: "qli-1038-1-arm",
          productName: "Robotic Articulation Module v4",
          sku: "ROB-ARM4",
          quantity: 6,
          unitPrice: "25000.00",
          discountPercent: "22.67",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "41.00",
          lineTotal: "116000.00",
          governanceStatus: "Over Limit (+7.6%)",
        },
      ],
      approval: {
        id: "appr-1038-globex",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.MEDIUM,
        currentStep: 1,
        requestedByEmail: "marcus.miller@ves.ac.in",
        assignedToEmail: "elena.rostova@odoo.com",
        submittedAt: dAgo(4, 10, 15),
        steps: [
          {
            id: "step-1038-1",
            stepOrder: 1,
            role: "Sales Review",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Discount threshold review for industrial customer",
          },
        ],
        history: [
          {
            id: "hist-1038-1",
            actorEmail: "marcus.miller@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for sales management approval.",
            createdAt: dAgo(4, 10, 15),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1041: Northstar Technologies ($84,500, Negotiation, Low Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1041-northstar",
      quotationNumber: "Q-1041",
      customerAccountId: "NT-40291",
      ownerEmail: "james.carter@ves.ac.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Negotiation",
      subtotal: "95000.00",
      discountTotal: "17000.00",
      taxTotal: "6500.00",
      totalValue: "84500.00",
      estimatedMargin: "48.00",
      riskScore: 38,
      createdAt: dAgo(6, 14, 0),
      lineItems: [
        {
          id: "qli-1041-1-trading",
          productName: "Low-Latency Trading Gateway Node",
          sku: "FIN-GW",
          quantity: 2,
          unitPrice: "47500.00",
          discountPercent: "17.89",
          discountLimitPercent: "20.00",
          estimatedMarginPercent: "48.00",
          lineTotal: "78000.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1041-northstar",
        status: ApprovalStatus.APPROVED,
        priority: ApprovalPriority.LOW,
        currentStep: 1,
        requestedByEmail: "james.carter@ves.ac.in",
        assignedToEmail: "elena.rostova@odoo.com",
        submittedAt: dAgo(6, 14, 30),
        resolvedAt: dAgo(5, 9, 0),
        steps: [
          {
            id: "step-1041-1",
            stepOrder: 1,
            role: "Commercial Review",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.APPROVED,
            notes: "Approved under FinTech strategic initiative tier.",
            completedAt: dAgo(5, 9, 0),
          },
        ],
        history: [
          {
            id: "hist-1041-1",
            actorEmail: "james.carter@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for standard strategic customer review.",
            createdAt: dAgo(6, 14, 30),
          },
          {
            id: "hist-1041-2",
            actorEmail: "elena.rostova@odoo.com",
            eventType: "APPROVED",
            message: "Elena Rostova approved the commercial discount structure.",
            createdAt: dAgo(5, 9, 0),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1035: Vertex Solutions ($42,800, Quote Sent, Low Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1035-vertex",
      quotationNumber: "Q-1035",
      customerAccountId: "VX-66190",
      ownerEmail: "rachel.kim@ves.ac.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Quote Sent",
      subtotal: "48000.00",
      discountTotal: "8500.00",
      taxTotal: "3300.00",
      totalValue: "42800.00",
      estimatedMargin: "52.00",
      riskScore: 22,
      createdAt: dAgo(9, 10, 0),
      lineItems: [
        {
          id: "qli-1035-1-appliance",
          productName: "NextGen Firewall Security Appliance",
          sku: "SEC-NGF",
          quantity: 4,
          unitPrice: "12000.00",
          discountPercent: "17.71",
          discountLimitPercent: "20.00",
          estimatedMarginPercent: "52.00",
          lineTotal: "39500.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1035-vertex",
        status: ApprovalStatus.APPROVED,
        priority: ApprovalPriority.LOW,
        currentStep: 1,
        requestedByEmail: "rachel.kim@ves.ac.in",
        assignedToEmail: "elena.rostova@odoo.com",
        submittedAt: dAgo(9, 10, 30),
        resolvedAt: dAgo(8, 16, 0),
        steps: [
          {
            id: "step-1035-1",
            stepOrder: 1,
            role: "Commercial Review",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.APPROVED,
            notes: "Security partner program discount approved.",
            completedAt: dAgo(8, 16, 0),
          },
        ],
        history: [
          {
            id: "hist-1035-1",
            actorEmail: "rachel.kim@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for partner discount review.",
            createdAt: dAgo(9, 10, 30),
          },
          {
            id: "hist-1035-2",
            actorEmail: "elena.rostova@odoo.com",
            eventType: "APPROVED",
            message: "Approved and dispatched to customer.",
            createdAt: dAgo(8, 16, 0),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1031: Nova Systems ($68,200, Negotiation, Medium Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1031-nova",
      quotationNumber: "Q-1031",
      customerAccountId: "NS-51204",
      ownerEmail: "david.vance@ves.ac.in",
      status: QuotationStatus.DRAFT,
      currentStage: "Negotiation",
      subtotal: "78000.00",
      discountTotal: "15000.00",
      taxTotal: "5200.00",
      totalValue: "68200.00",
      estimatedMargin: "39.00",
      riskScore: 45,
      createdAt: dAgo(12, 15, 0),
      lineItems: [
        {
          id: "qli-1031-1-transceiver",
          productName: "Optical High-Density Transceiver",
          sku: "OPT-HDT",
          quantity: 12,
          unitPrice: "6500.00",
          discountPercent: "19.23",
          discountLimitPercent: "20.00",
          estimatedMarginPercent: "39.00",
          lineTotal: "63000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // Q-1037: Apex Logistics ($54,100, Quote Sent, Inactive Follow Up)
    // -----------------------------------------------------------------------
    {
      id: "q-1037-apex",
      quotationNumber: "Q-1037",
      customerAccountId: "AL-22194",
      ownerEmail: "james.carter@ves.ac.in",
      status: QuotationStatus.DRAFT,
      currentStage: "Quote Sent",
      subtotal: "60000.00",
      discountTotal: "10000.00",
      taxTotal: "4100.00",
      totalValue: "54100.00",
      estimatedMargin: "44.00",
      riskScore: 35,
      createdAt: dAgo(15, 11, 0),
      lineItems: [
        {
          id: "qli-1037-1-fleet",
          productName: "Fleet Telematics Integration Suite",
          sku: "FLT-TEL",
          quantity: 1,
          unitPrice: "60000.00",
          discountPercent: "16.67",
          discountLimitPercent: "20.00",
          estimatedMarginPercent: "44.00",
          lineTotal: "50000.00",
          governanceStatus: "Within Limit",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // Q-1048: Northwind Solutions ($115,000, Confirmed / Approved, Low Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1048-northwind",
      quotationNumber: "Q-1048",
      customerAccountId: "NW-18492",
      ownerEmail: "marcus.miller@ves.ac.in",
      status: QuotationStatus.APPROVED,
      currentStage: "Confirmed",
      subtotal: "130000.00",
      discountTotal: "24000.00",
      taxTotal: "9000.00",
      totalValue: "115000.00",
      estimatedMargin: "46.00",
      riskScore: 28,
      createdAt: dAgo(20, 16, 0),
      lineItems: [
        {
          id: "qli-1048-1-warehouse",
          productName: "Automated Warehouse Guidance System",
          sku: "WMS-AGS",
          quantity: 2,
          unitPrice: "65000.00",
          discountPercent: "18.46",
          discountLimitPercent: "20.00",
          estimatedMarginPercent: "46.00",
          lineTotal: "106000.00",
          governanceStatus: "Within Limit",
        },
      ],
      approval: {
        id: "appr-1048-northwind",
        status: ApprovalStatus.APPROVED,
        priority: ApprovalPriority.LOW,
        currentStep: 1,
        requestedByEmail: "marcus.miller@ves.ac.in",
        assignedToEmail: "marcus.vance@odoo.com",
        submittedAt: dAgo(20, 16, 30),
        resolvedAt: dAgo(19, 11, 0),
        steps: [
          {
            id: "step-1048-1",
            stepOrder: 1,
            role: "Commercial Review",
            approverEmail: "marcus.vance@odoo.com",
            status: WorkflowStepStatus.APPROVED,
            notes: "Approved under enterprise volume framework.",
            completedAt: dAgo(19, 11, 0),
          },
        ],
        history: [
          {
            id: "hist-1048-1",
            actorEmail: "marcus.miller@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for contract execution authorization.",
            createdAt: dAgo(20, 16, 30),
          },
          {
            id: "hist-1048-2",
            actorEmail: "marcus.vance@odoo.com",
            eventType: "APPROVED",
            message: "Authorized by Finance for contract binding.",
            createdAt: dAgo(19, 11, 0),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1050: Cyberdyne Analytics ($34,900, Draft, Low Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1050-cyberdyne",
      quotationNumber: "Q-1050",
      customerAccountId: "CA-99302",
      ownerEmail: "rachel.kim@ves.ac.in",
      status: QuotationStatus.DRAFT,
      currentStage: "Drafting",
      subtotal: "38000.00",
      discountTotal: "5500.00",
      taxTotal: "2400.00",
      totalValue: "34900.00",
      estimatedMargin: "54.00",
      riskScore: 18,
      createdAt: dAgo(25, 14, 0),
      lineItems: [
        {
          id: "qli-1050-1-inference",
          productName: "AI Edge Inference Workstation",
          sku: "AI-WKS",
          quantity: 2,
          unitPrice: "19000.00",
          discountPercent: "14.47",
          discountLimitPercent: "15.00",
          estimatedMarginPercent: "54.00",
          lineTotal: "32500.00",
          governanceStatus: "Within Limit",
        },
      ],
    },

    // -----------------------------------------------------------------------
    // Q-1052: Stellar Dynamics ($210,000, In Review, High Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1052-stellar",
      quotationNumber: "Q-1052",
      customerAccountId: "SD-44109",
      ownerEmail: "david.vance@ves.ac.in",
      status: QuotationStatus.IN_REVIEW,
      currentStage: "Executive Approval",
      subtotal: "240000.00",
      discountTotal: "48000.00",
      taxTotal: "18000.00",
      totalValue: "210000.00",
      estimatedMargin: "33.00",
      riskScore: 78,
      createdAt: dAgo(28, 10, 0),
      lineItems: [
        {
          id: "qli-1052-1-ground",
          productName: "Satellite Ground Telemetry System",
          sku: "SAT-GND",
          quantity: 1,
          unitPrice: "180000.00",
          discountPercent: "20.00",
          discountLimitPercent: "12.00",
          estimatedMarginPercent: "32.00",
          lineTotal: "144000.00",
          governanceStatus: "Over Limit (+8%)",
        },
        {
          id: "qli-1052-2-support",
          productName: "Orbital Tracking Calibration SLA",
          sku: "SAT-SLA",
          quantity: 1,
          unitPrice: "60000.00",
          discountPercent: "20.00",
          discountLimitPercent: "10.00",
          estimatedMarginPercent: "36.00",
          lineTotal: "48000.00",
          governanceStatus: "Over Limit (+10%)",
        },
      ],
      approval: {
        id: "appr-1052-stellar",
        status: ApprovalStatus.PENDING,
        priority: ApprovalPriority.URGENT,
        currentStep: 3,
        requestedByEmail: "david.vance@ves.ac.in",
        assignedToEmail: "elena.rostova@odoo.com",
        submittedAt: dAgo(28, 10, 30),
        steps: [
          {
            id: "step-1052-1",
            stepOrder: 1,
            role: "Sales Director",
            approverEmail: "james.carter@ves.ac.in",
            status: WorkflowStepStatus.APPROVED,
            notes: "Initial strategic customer justification endorsed.",
            completedAt: dAgo(28, 12, 0),
          },
          {
            id: "step-1052-2",
            stepOrder: 2,
            role: "Finance Director",
            approverEmail: "marcus.vance@odoo.com",
            status: WorkflowStepStatus.APPROVED,
            notes: "Margin floor risk accepted subject to VP Commercial sign-off.",
            completedAt: dAgo(27, 16, 0),
          },
          {
            id: "step-1052-3",
            stepOrder: 3,
            role: "VP Commercial",
            approverEmail: "elena.rostova@odoo.com",
            status: WorkflowStepStatus.IN_PROGRESS,
            notes: "Pending executive sign-off on non-standard warranty clauses.",
          },
        ],
        history: [
          {
            id: "hist-1052-1",
            actorEmail: "david.vance@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for urgent executive authorization.",
            createdAt: dAgo(28, 10, 30),
          },
          {
            id: "hist-1052-2",
            actorEmail: "james.carter@ves.ac.in",
            eventType: "APPROVED",
            message: "Sales Director approved step 1.",
            createdAt: dAgo(28, 12, 0),
          },
          {
            id: "hist-1052-3",
            actorEmail: "marcus.vance@odoo.com",
            eventType: "APPROVED",
            message: "Finance Director approved step 2 with condition.",
            createdAt: dAgo(27, 16, 0),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1022: BioTech Innovations ($74,300, Rejected, High Risk)
    // -----------------------------------------------------------------------
    {
      id: "q-1022-biotech",
      quotationNumber: "Q-1022",
      customerAccountId: "BI-11928",
      ownerEmail: "marcus.miller@ves.ac.in",
      status: QuotationStatus.REJECTED,
      currentStage: "Discount Rejected",
      subtotal: "90000.00",
      discountTotal: "21000.00",
      taxTotal: "5300.00",
      totalValue: "74300.00",
      estimatedMargin: "21.00",
      riskScore: 64,
      createdAt: dAgo(45, 9, 0),
      lineItems: [
        {
          id: "qli-1022-1-analyzer",
          productName: "Microfluidic Chemistry Analyzer",
          sku: "BIO-MCA",
          quantity: 3,
          unitPrice: "30000.00",
          discountPercent: "23.33",
          discountLimitPercent: "10.00",
          estimatedMarginPercent: "21.00",
          lineTotal: "69000.00",
          governanceStatus: "Over Limit (+13.3%)",
        },
      ],
      approval: {
        id: "appr-1022-biotech",
        status: ApprovalStatus.REJECTED,
        priority: ApprovalPriority.HIGH,
        currentStep: 2,
        requestedByEmail: "marcus.miller@ves.ac.in",
        assignedToEmail: "marcus.vance@odoo.com",
        submittedAt: dAgo(45, 9, 30),
        resolvedAt: dAgo(44, 15, 0),
        steps: [
          {
            id: "step-1022-1",
            stepOrder: 1,
            role: "Sales Manager",
            approverEmail: "james.carter@ves.ac.in",
            status: WorkflowStepStatus.APPROVED,
            completedAt: dAgo(45, 11, 0),
          },
          {
            id: "step-1022-2",
            stepOrder: 2,
            role: "Finance Review",
            approverEmail: "marcus.vance@odoo.com",
            status: WorkflowStepStatus.REJECTED,
            notes: "Margin of 21% violates company floor policy of 30%.",
            completedAt: dAgo(44, 15, 0),
          },
        ],
        history: [
          {
            id: "hist-1022-1",
            actorEmail: "marcus.miller@ves.ac.in",
            eventType: "SUBMITTED",
            message: "Submitted for deep discount review.",
            createdAt: dAgo(45, 9, 30),
          },
          {
            id: "hist-1022-2",
            actorEmail: "marcus.vance@odoo.com",
            eventType: "REJECTED",
            message: "Marcus Vance rejected quote Q-1022: Margin below absolute floor.",
            createdAt: dAgo(44, 15, 0),
          },
        ],
      },
    },

    // -----------------------------------------------------------------------
    // Q-1018: Northstar Technologies ($162,500, Expired Historical Deal)
    // -----------------------------------------------------------------------
    {
      id: "q-1018-northstar-old",
      quotationNumber: "Q-1018",
      customerAccountId: "NT-40291",
      ownerEmail: "james.carter@ves.ac.in",
      status: QuotationStatus.EXPIRED,
      currentStage: "Validity Window Expired",
      subtotal: "180000.00",
      discountTotal: "30000.00",
      taxTotal: "12500.00",
      totalValue: "162500.00",
      estimatedMargin: "45.00",
      riskScore: 30,
      createdAt: dAgo(75, 10, 0),
      lineItems: [
        {
          id: "qli-1018-1-crypto",
          productName: "Hardware Security Module (HSM) Cluster",
          sku: "SEC-HSM",
          quantity: 2,
          unitPrice: "90000.00",
          discountPercent: "16.67",
          discountLimitPercent: "18.00",
          estimatedMarginPercent: "45.00",
          lineTotal: "150000.00",
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

    if (!customerId) {
      throw new Error(`Customer with external ID ${qDef.customerAccountId} not found!`);
    }
    if (!ownerId) {
      throw new Error(`Owner with email ${qDef.ownerEmail} not found!`);
    }

    // 1. Upsert Quotation
    const quote = await prisma.quotation.upsert({
      where: { quotationNumber: qDef.quotationNumber },
      update: {
        customerId,
        ownerId,
        status: qDef.status,
        currentStage: qDef.currentStage,
        currency: "USD",
        subtotal: qDef.subtotal,
        discountTotal: qDef.discountTotal,
        taxTotal: qDef.taxTotal,
        totalValue: qDef.totalValue,
        estimatedMargin: qDef.estimatedMargin,
        riskScore: qDef.riskScore,
      },
      create: {
        id: qDef.id,
        quotationNumber: qDef.quotationNumber,
        customerId,
        ownerId,
        status: qDef.status,
        currentStage: qDef.currentStage,
        currency: "USD",
        subtotal: qDef.subtotal,
        discountTotal: qDef.discountTotal,
        taxTotal: qDef.taxTotal,
        totalValue: qDef.totalValue,
        estimatedMargin: qDef.estimatedMargin,
        riskScore: qDef.riskScore,
        createdAt: qDef.createdAt,
      },
    });

    // 2. Upsert QuoteLineItems
    for (const li of qDef.lineItems) {
      await prisma.quoteLineItem.upsert({
        where: { id: li.id },
        update: {
          quotationId: quote.id,
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
          id: li.id,
          quotationId: quote.id,
          productName: li.productName,
          sku: li.sku,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discountPercent: li.discountPercent,
          discountLimitPercent: li.discountLimitPercent,
          estimatedMarginPercent: li.estimatedMarginPercent,
          lineTotal: li.lineTotal,
          governanceStatus: li.governanceStatus,
          createdAt: qDef.createdAt,
        },
      });
      totalLineItems++;
    }

    // 3. Upsert Approval, Workflow Steps & History (if defined)
    if (qDef.approval) {
      const requestedById = seededUsers[qDef.approval.requestedByEmail];
      const assignedToId = qDef.approval.assignedToEmail
        ? seededUsers[qDef.approval.assignedToEmail]
        : null;

      const approval = await prisma.approval.upsert({
        where: { id: qDef.approval.id },
        update: {
          quotationId: quote.id,
          status: qDef.approval.status,
          priority: qDef.approval.priority,
          currentStep: qDef.approval.currentStep,
          requestedById,
          assignedToId,
          submittedAt: qDef.approval.submittedAt,
          resolvedAt: qDef.approval.resolvedAt ?? null,
        },
        create: {
          id: qDef.approval.id,
          quotationId: quote.id,
          status: qDef.approval.status,
          priority: qDef.approval.priority,
          currentStep: qDef.approval.currentStep,
          requestedById,
          assignedToId,
          submittedAt: qDef.approval.submittedAt,
          resolvedAt: qDef.approval.resolvedAt ?? null,
          createdAt: qDef.approval.submittedAt,
        },
      });
      totalApprovals++;

      // Workflow Steps
      for (const st of qDef.approval.steps) {
        const stepApproverId = st.approverEmail ? seededUsers[st.approverEmail] : null;

        await prisma.approvalWorkflowStep.upsert({
          where: { id: st.id },
          update: {
            approvalId: approval.id,
            stepOrder: st.stepOrder,
            role: st.role,
            approverId: stepApproverId,
            status: st.status,
            notes: st.notes ?? null,
            completedAt: st.completedAt ?? null,
          },
          create: {
            id: st.id,
            approvalId: approval.id,
            stepOrder: st.stepOrder,
            role: st.role,
            approverId: stepApproverId,
            status: st.status,
            notes: st.notes ?? null,
            completedAt: st.completedAt ?? null,
            createdAt: qDef.approval.submittedAt,
          },
        });
        totalWorkflowSteps++;
      }

      // History Events
      for (const h of qDef.approval.history) {
        const actorId = h.actorEmail ? seededUsers[h.actorEmail] : null;

        await prisma.approvalHistory.upsert({
          where: { id: h.id },
          update: {
            approvalId: approval.id,
            actorId,
            eventType: h.eventType,
            message: h.message,
            createdAt: h.createdAt,
          },
          create: {
            id: h.id,
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

  console.log("✅ Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log(`Users: ${usersData.length}`);
  console.log(`Customers: ${customersData.length}`);
  console.log(`Quotations: ${quotationsData.length}`);
  console.log(`Quote Lines: ${totalLineItems}`);
  console.log(`Approvals: ${totalApprovals}`);
  console.log(`Workflow Steps: ${totalWorkflowSteps}`);
  console.log(`Approval History Events: ${totalHistoryEvents}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
