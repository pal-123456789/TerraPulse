import { Link } from "react-router-dom";
import { Globe, Mail, Github, Linkedin, Twitter, Shield, FileText, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { memo } from "react";

const SocialLink = memo(({ href, icon: Icon }: { href: string; icon: React.ElementType }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 rounded-lg bg-card/50 flex items-center justify-center text-muted-foreground transition-all duration-300 relative overflow-hidden group"
    whileHover={{ scale: 1.1, y: -2 }}
    whileTap={{ scale: 0.95 }}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"
    />
    <Icon className="w-5 h-5 relative z-10 group-hover:text-primary transition-colors" />
  </motion.a>
));

SocialLink.displayName = "SocialLink";

const FooterLink = memo(({ to, icon: Icon, label }: { to: string; icon?: React.ElementType; label: string }) => (
  <motion.li whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
    <Link
      to={to}
      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
    >
      {Icon ? (
        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary group-hover:shadow-[0_0_8px_hsl(180,100%,50%)] transition-all" />
      )}
      {label}
    </Link>
  </motion.li>
));

FooterLink.displayName = "FooterLink";

const Footer = memo(() => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/map", label: "Map Explorer" },
    { to: "/explore", label: "Explore" },
    { to: "/analytic", label: "AnalyticHub" },
    { to: "/learn", label: "Learn" },
    { to: "/about", label: "About" },
  ];

  return (
    <footer className="relative border-t border-border/50 bg-card/30 backdrop-blur-xl mt-20 overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{ duration: 20, repeat: Infinity }}
        style={{ backgroundSize: "200% 200%" }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                <Globe className="w-8 h-8 text-primary" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">
                Terra<span className="text-primary text-glow">Pulse</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-Powered Environmental Monitoring System detecting and predicting natural anomalies in real-time.
            </p>
            <div className="flex gap-3">
              <SocialLink href="https://github.com" icon={Github} />
              <SocialLink href="https://linkedin.com" icon={Linkedin} />
              <SocialLink href="https://twitter.com" icon={Twitter} />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <FooterLink key={link.to} {...link} />
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              <FooterLink to="/privacy" icon={Shield} label="Privacy Policy" />
              <FooterLink to="/terms" icon={FileText} label="Terms of Service" />
              <FooterLink to="/about" icon={Info} label="About Us" />
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Contact</h3>
            <motion.div 
              className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all group"
              whileHover={{ scale: 1.02 }}
            >
              <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0 group-hover:animate-pulse" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Pal Ghevariya</p>
                <a
                  href="mailto:palghevariya.co23d2@scet.ac.in"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 break-all"
                >
                  palghevariya.co23d2@scet.ac.in
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="mt-12 pt-8 border-t border-border/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} TerraPulse. All rights reserved. Developed by Pal Ghevariya
            </p>
            <div className="flex items-center gap-4">
              {[
                { to: "/privacy", label: "Privacy" },
                { to: "/terms", label: "Terms" },
                { to: "/about", label: "About" },
              ].map((link, i) => (
                <span key={link.to} className="flex items-center gap-4">
                  <Link
                    to={link.to}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                  {i < 2 && <span className="text-muted-foreground/50">•</span>}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Animated particle dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
