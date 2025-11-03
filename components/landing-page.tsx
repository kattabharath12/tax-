
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Zap, CheckCircle, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-6xl items-center justify-between px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">TAXGROK</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-20 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              AI-Powered Tax Prep
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Tax Prep
            <br />
            <span className="text-gradient">Reimagined</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload documents, get instant data extraction, file in minutes.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-tax hover:opacity-90 h-14 px-8 text-lg">
                Start Filing Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg" onClick={() => {
              const featuresSection = document.querySelector('section:nth-of-type(2)');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </Button>
          </motion.div>
          
          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>IRS compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span>2-min filing</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Three Simple Steps</h2>
          <p className="text-lg text-muted-foreground">
            Professional tax prep, simplified
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Upload className="h-10 w-10 text-primary" />,
              step: "01",
              title: "Upload",
              description: "Drop your tax docs and we'll extract everything instantly"
            },
            {
              icon: <CheckCircle className="h-10 w-10 text-primary" />,
              step: "02", 
              title: "Review",
              description: "Verify the auto-populated data and make any adjustments"
            },
            {
              icon: <FileText className="h-10 w-10 text-primary" />,
              step: "03",
              title: "File",
              description: "Download your complete Form 1040 and submit electronically"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute -top-2 -right-2 text-6xl font-bold text-gray-100 select-none">
                      {feature.step}
                    </div>
                    <div className="relative z-10 mx-auto p-4 bg-primary/10 rounded-2xl w-fit">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Documents Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Works with all your tax documents</h2>
            <p className="text-muted-foreground">
              Automatic data extraction from any tax form
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {["W-2", "1099-DIV", "1099-MISC", "1099-INT", "1099-NEC", "1040"].map((form, index) => (
              <motion.div
                key={form}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-gray-900">{form}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">About TAXGROK</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Revolutionizing tax preparation through cutting-edge artificial intelligence and enterprise-grade security
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-6">Our Technology Stack</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Azure Document Intelligence</h4>
                    <p className="text-muted-foreground">Microsoft's enterprise AI service extracts data from tax documents with 99.5% accuracy, supporting complex forms like W-2s, 1099s, and Schedule C.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Real-time Processing</h4>
                    <p className="text-muted-foreground">Next.js 14 with TypeScript provides lightning-fast document processing and form generation, typically completing analysis in under 60 seconds.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">IRS Compliance</h4>
                    <p className="text-muted-foreground">Built-in tax calculations follow current IRS guidelines and regulations, automatically applying standard deductions, tax brackets, and credits.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
                <h4 className="text-xl font-bold mb-4">Security & Privacy</h4>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Bank-level 256-bit SSL encryption</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>SOC 2 Type II certified infrastructure</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Zero-knowledge architecture</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Automatic data purging post-filing</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-primary/5 to-green-50">
                <h4 className="text-xl font-bold mb-4">Professional Accuracy</h4>
                <p className="text-muted-foreground mb-4">
                  Our tax calculations are developed by certified tax professionals and validated against IRS publications. Every calculation includes:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Current year tax brackets and rates</li>
                  <li>• Standard and itemized deduction optimization</li>
                  <li>• Federal and state tax coordination</li>
                  <li>• Audit trail for all calculations</li>
                </ul>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about TAXGROK's AI-powered tax preparation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-4"
          >
            {[
              {
                question: "How accurate is the AI document extraction?",
                answer: "Our Azure Document Intelligence service achieves 99.5% accuracy on tax documents. The system is trained specifically on IRS forms and can handle handwritten entries, poor-quality scans, and complex layouts. All extracted data is presented for your review and can be edited before filing."
              },
              {
                question: "Which tax documents are supported?",
                answer: "TAXGROK supports all common tax documents including W-2 (wages), 1099-INT (interest), 1099-DIV (dividends), 1099-NEC (non-employee compensation), 1099-MISC (miscellaneous income), 1098 (mortgage interest), and most Schedule forms. We continuously expand support based on user needs."
              },
              {
                question: "Is my tax data secure and private?",
                answer: "Absolutely. We use bank-level 256-bit SSL encryption, SOC 2 Type II certified infrastructure, and a zero-knowledge architecture where even we cannot access your raw tax data. All documents are automatically purged after filing, and we never store or share your personal information."
              },
              {
                question: "How are tax calculations performed?",
                answer: "All calculations follow current IRS guidelines and are developed by certified tax professionals. The system automatically applies the correct tax brackets, standard/itemized deductions, credits, and penalties. Each calculation includes a detailed audit trail showing exactly how your tax liability was determined."
              },
              {
                question: "Can I file both federal and state returns?",
                answer: "Currently, TAXGROK generates complete federal returns (Form 1040) with all necessary schedules. State return filing capabilities vary by state and are being progressively added. The system automatically calculates state tax obligations where supported."
              },
              {
                question: "What if I need to make corrections after filing?",
                answer: "The platform maintains a complete record of your filing for reference. If amendments are needed, you can re-upload corrected documents and regenerate your return. For filed returns requiring amendments, we provide guidance on IRS Form 1040X procedures."
              },
              {
                question: "How long does the filing process take?",
                answer: "Document processing typically completes within 60 seconds. The entire filing process—from upload to final review—usually takes 5-10 minutes for straightforward returns. Complex returns with multiple income sources may take slightly longer for thorough review."
              },
              {
                question: "Is there support for complex tax situations?",
                answer: "TAXGROK handles most common tax scenarios including multiple income sources, basic deductions and credits, and standard investment income. For complex situations like business ownership, rental properties, or foreign income, we recommend consulting with a tax professional."
              },
              {
                question: "What happens if there's an error in my return?",
                answer: "Our system includes multiple validation layers to prevent errors. However, if an issue arises, we provide detailed error explanations and correction guidance. All calculations include transparent breakdowns so you can verify accuracy before filing."
              },
              {
                question: "How much does TAXGROK cost?",
                answer: "TAXGROK offers transparent, straightforward pricing with no hidden fees. Our basic service handles most individual tax situations at a fraction of traditional tax preparation costs. Premium features for complex returns are available as needed. No payment is required until you're ready to file."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <Card className="hover:shadow-md transition-shadow border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center mt-12"
          >
            <Card className="p-8 border-0 shadow-lg bg-gradient-to-r from-primary/5 to-green-50">
              <CardContent className="p-0">
                <h3 className="text-xl font-bold mb-4">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">
                  Our tax preparation technology is designed to handle complex scenarios with professional accuracy. 
                  For questions not covered here, our support team includes certified tax professionals.
                </p>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-tax hover:opacity-90">
                    Start Your Free Return
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-tax text-white py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">File your taxes in 2 minutes</h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              No hidden fees. No complicated forms. Just simple, accurate tax preparation.
            </p>
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 transition-colors h-14 px-8 text-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center max-w-6xl">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">TAXGROK</span>
          </div>
          <p className="text-gray-400">
            © TAXGROK. Simplified tax preparation for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
