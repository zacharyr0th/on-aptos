"use client";

import { Globe, Hash, MapPin } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const socialLinks = [
  { name: "Discord", url: "https://discord.gg/aptosnetwork" },
  { name: "X (Aptos Labs)", url: "https://twitter.com/aptoslabs" },
  { name: "X (Aptos Network)", url: "https://twitter.com/Aptos_Network" },
  { name: "YouTube", url: "https://www.youtube.com/@aptosnetwork" },
  { name: "LinkedIn", url: "https://www.linkedin.com/company/aptoslabs" },
  { name: "Forum", url: "https://forum.aptoslabs.com/" },
  { name: "Medium", url: "https://medium.com/aptoslabs" },
  { name: "Collective", url: "https://aptosfoundation.org/currents/join-the-aptos-collective" },
];

const regionalCommunities = [
  { name: "Poland", url: "https://twitter.com/Aptos_polska", flag: "🇵🇱" },
  { name: "India", url: "https://twitter.com/aptos_ind", flag: "🇮🇳" },
  { name: "Indonesia", url: "https://twitter.com/Aptos_Indonesia", flag: "🇮🇩" },
  { name: "Japan", url: "https://twitter.com/aptos_japan", flag: "🇯🇵" },
  { name: "China", url: "https://twitter.com/aptoscnofficial", flag: "🇨🇳" },
  { name: "France", url: "https://twitter.com/aptosfrance", flag: "🇫🇷" },
  { name: "Russia", url: "https://twitter.com/aptos_ru", flag: "🇷🇺" },
  { name: "Turkey", url: "https://twitter.com/AptosTurkiye", flag: "🇹🇷" },
  { name: "Africa", url: "https://twitter.com/Aptos_Africa", flag: "🌍" },
];

const officialLinks = [
  { name: "Aptos Labs", url: "https://aptoslabs.com/" },
  { name: "Aptos Foundation", url: "https://aptosfoundation.org/" },
  { name: "Ecosystem Projects", url: "https://aptosfoundation.org/ecosystem/projects/all" },
  { name: "Developer Docs", url: "https://aptos.dev/" },
  { name: "Explorer", url: "https://explorer.aptoslabs.com/?network=mainnet" },
  { name: "GitHub Profile", url: "https://github.com/aptos-labs" },
  { name: "Source Code", url: "https://github.com/aptos-labs/aptos-core" },
  { name: "Foundation Blog", url: "https://aptosfoundation.org/currents" },
  { name: "Open Roles", url: "https://aptoslabs.com/careers" },
];

export default function CommunitySection() {
  return (
    <section id="community" className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Community Hub
          </h2>
          <p className="text-base sm:text-lg text-foreground/70 max-w-5xl mx-auto">
            Connect with the global Aptos community and access official resources
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Social Media Hub */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
          >
            <Card className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                Social Media
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {socialLinks.map((social, index) => (
                  <Link
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                  >
                    <span className="text-sm text-foreground/70 group-hover:text-primary transition-colors">{social.name}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Regional Communities Hub */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          >
            <Card className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Regional Communities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {regionalCommunities.map((community, index) => (
                  <Link
                    key={index}
                    href={community.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{community.flag}</span>
                    <span className="text-sm text-foreground/70 group-hover:text-primary transition-colors">{community.name}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Official Resources */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
          >
            <Card className="p-6">
              <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Official Resources
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {officialLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                  >
                    <span className="text-sm text-foreground/70 group-hover:text-primary transition-colors">{link.name}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
