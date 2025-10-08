"use client";

import { BookOpen, Code2, ExternalLink, Github, Wrench } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const developerTools = [
  {
    name: "Gas Profiler",
    description: "Analyze transaction gas usage with flamegraphs and cost breakdowns",
    href: "https://aptos.dev/en/build/cli/working-with-move-contracts/local-simulation-benchmarking-and-gas-profiling#gas-profiler",
    icon: Wrench,
  },
  {
    name: "Aptos Explorer",
    description: "Explore transactions, accounts, events, and network activities",
    href: "https://explorer.aptoslabs.com/",
    icon: Code2,
  },
  {
    name: "Create Aptos DApp",
    description: "Bootstrap dapps with starter templates and Move modules",
    href: "https://aptos.dev/en/build/create-aptos-dapp",
    icon: Code2,
  },
  {
    name: "Developer Portal",
    description: "API keys, Transaction Stream, and Indexer API access",
    href: "https://geomi.dev/",
    icon: Wrench,
  },
  {
    name: "Identity Connect",
    description: "Single sign-on with Gmail, Facebook, or Twitter for dapps",
    href: "https://aptos.dev/en/build/guides/aptos-keyless-integration-guide",
    icon: Code2,
  },
  {
    name: "Aptos Names Service",
    description: "Human-readable addresses and digital identity framework",
    href: "https://www.aptosnames.com/",
    icon: Wrench,
  },
  {
    name: "Revela Decompiler",
    description: "Decompile Move bytecode back to source code",
    href: "https://github.com/verichains/revela",
    icon: Github,
  },
  {
    name: "Aptos Assistant",
    description: "AI chatbot for development assistance",
    href: "https://aptos.dev/en/build/apis/aptos-labs-developer-portal#aptos-assistant",
    icon: Code2,
  },
];

const documentation = [
  {
    name: "Aptos Core",
    description: "Main Aptos blockchain repository",
    href: "https://github.com/aptos-labs/aptos-core",
    icon: Github,
    category: "GitHub",
  },
  {
    name: "Aptos Developer Documentation",
    description: "Complete developer guide and API reference",
    href: "https://aptos.dev/",
    icon: BookOpen,
    category: "Docs",
  },
  {
    name: "Move Reference Docs",
    description: "Move programming language documentation",
    href: "https://aptos.dev/en/build/smart-contracts",
    icon: BookOpen,
    category: "Docs",
  },
];

export function DeveloperResourcesSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">For Developers</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Build safer, faster apps with Move. Access open-source tools, APIs, and comprehensive
          guides to launch in days, not months.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Developer Tools Section */}
        <AccordionItem value="developer-tools" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            <div className="flex items-center gap-3">
              <Wrench className="size-5" />
              Developer Tools
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {developerTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card key={tool.name} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          {tool.name}
                          <a
                            href={tool.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Documentation & Guides Section */}
        <AccordionItem value="documentation" className="border rounded-lg px-6">
          <AccordionTrigger className="text-xl font-semibold hover:no-underline">
            <div className="flex items-center gap-3">
              <BookOpen className="size-5" />
              Documentation &amp; Guides
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {documentation.map((doc) => {
                const Icon = doc.icon;
                return (
                  <Card key={doc.name} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="size-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {doc.category}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          {doc.name}
                          <a
                            href={doc.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </h3>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h3 className="text-2xl font-bold mb-3">Ready to Start Building?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Move makes it safe to build scalable apps. Check out the docs and start developing
            today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="https://aptos.dev/" target="_blank" rel="noopener noreferrer">
                <BookOpen className="mr-2 size-5" />
                View Documentation
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com/aptos-labs/aptos-core"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 size-5" />
                Explore GitHub
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
