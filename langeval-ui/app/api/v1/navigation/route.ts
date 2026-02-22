import { NextResponse } from 'next/server';
import { delay } from '@/lib/api-utils';

const navGroups = [
  {
    title: "Documentation",
    items: [
      {
        name: "Project Documentation",
        href: "/docs",
        icon: "BookOpen",
        description: "System architecture & business requirements."
      }
    ]
  },
  {
    title: "Executive View",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
        description: "Project health overview & Release decisions."
      },
      {
        name: "Reports",
        href: "/reports",
        icon: "BarChart3",
        description: "Trend analysis & PDF reports."
      }
    ]
  },
  {
    title: "Developer Tools",
    items: [
      {
        name: "Dev Console",
        href: "/dev-console",
        icon: "Terminal",
        description: "CI/CD Pipeline & Unit Test logs."
      },
      {
        name: "Trace Debugger",
        href: "/trace",
        icon: "Activity",
        description: "Deep dive into LangChain execution."
      },
      {
        name: "Contribution",
        href: "/contribution",
        icon: "GitBranch",
        description: "Contribute to Golden Dataset."
      }
    ]
  },
  {
    title: "Evaluation",
    items: [
      {
        name: "Scenario Builder",
        href: "/scenario-builder",
        icon: "BrainCircuit",
        description: "Create test scenarios (No-code drag & drop)."
      },
      {
        name: "Scenario History",
        href: "/campaigns",
        icon: "Clock",
        description: "Execution history & detailed results."
      },
      {
        name: "Battle Arena",
        href: "/battle-arena",
        icon: "Target",
        description: "Adversarial simulation & monitoring."
      },
      {
        name: "Human Review",
        href: "/human-review",
        icon: "Users",
        description: "Manual scoring for edge cases."
      }
    ]
  },
  {
    title: "Security & Benchmarks",
    items: [
      {
        name: "Red Teaming",
        href: "/red-teaming",
        icon: "ShieldCheck",
        description: "Automated security attacks (Jailbreak)."
      },
      {
        name: "Benchmarks",
        href: "/benchmarks",
        icon: "BarChart3",
        description: "Academic benchmarks (MMLU, GSM8K)."
      }
    ]
  },
  {
    title: "Configuration",
    items: [
      {
        name: "AI Agents",
        href: "/agents",
        icon: "Webhook",
        description: "Manage AI projects & CI/CD trigger config."
      },
      {
        name: "Models",
        href: "/models",
        icon: "BrainCircuit",
        description: "Manage LLM Registry (GPT-4, Claude 3.5)."
      },
      {
        name: "Knowledge Bases",
        href: "/knowledge-bases",
        icon: "Database",
        description: "Manage Vector DB & RAG Sources."
      },
      {
        name: "Test Datasets",
        href: "/dataset-gen",
        icon: "FileCode",
        description: "Auto-generate test data from documents."
      },
      {
        name: "Metrics Library",
        href: "/metrics-library",
        icon: "Settings",
        description: "Configure evaluation standards & Custom G-Eval."
      },
      {
        name: "Billing & Plans",
        href: "/settings/billing",
        icon: "CreditCard",
        description: "Manage subscription and usage limits."
      }
    ]
  }
];

export async function GET() {
  return NextResponse.json({ data: navGroups });
}
