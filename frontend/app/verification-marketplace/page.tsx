"use client";

import React, { useEffect, useState, useRef } from "react";
import FeatureCard from "../../components/marketplace/feature-card";
import NewsCard from "../../components/marketplace/news-card";
import MarketplaceHero from "../../components/marketplace/marketplace-hero";
import ProviderSection from "../../components/marketplace/provider-section";
import HowItWorks from "../../components/marketplace/how-it-works";
import NFTCredential from "../../components/marketplace/nft-credential";
import CtaSection from "../../components/marketplace/cta-section";
import ScrollToTop from "../../components/marketplace/scroll-to-top";
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import Image from "next/image";

export default function VerificationMarketplace() {
  // This will contain visibility states for different sections
  const [sectionsReady, setSectionsReady] = useState(false);
  
  useEffect(() => {
    // Wait until page has loaded before triggering animations
    const timer = setTimeout(() => {
      setSectionsReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Sections that will animate when they come into view
  const { ref: featuresRef, inView: featuresInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const { ref: newsRef, inView: newsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const { ref: providersRef, inView: providersInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero Section */}
      <section className="py-12 md:py-24">
        <MarketplaceHero />
      </section>
      
      {/* What is Verification Marketplace - Minimalist grid */}
      <section ref={featuresRef} className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className={`
            text-center mb-16
            ${sectionsReady && featuresInView ? 'animate-smooth-appear' : 'opacity-0'}
          `}>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900">What is Verification Marketplace?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform connects content creators with powerful verification services to authenticate AI-generated content
            </p>
          </div>
          
          {/* Clean, minimalist grid layout */}
          <div className="grid grid-cols-6 grid-rows-2 gap-4 auto-rows-fr">
            {/* Verification Algorithms */}
            <div className="col-span-6 md:col-span-3 row-span-1">
              <FeatureCard
                title="Verification Algorithms"
                description="Providers list their proprietary algorithms through APIs for verifying AI-generated content. Our marketplace creates healthy competition between providers."
                colorAccent="bg-gradient-to-r from-indigo-600 to-blue-600"
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 16L12 14V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 17C14 17 15 17 15 16C15 15 14 15 13 15C12 15 11 15 11 14C11 13 12 13 12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                delay={0}
              />
            </div>
            
            {/* Smart Accuracy Score */}
            <div className="col-span-6 md:col-span-3 row-span-1">
              <FeatureCard
                title="Smart Accuracy Score"
                description="Authentica automatically generates an accuracy score based on data set, executing smart contracts to assess the model."
                colorAccent="bg-gradient-to-r from-emerald-600 to-cyan-600"
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M15.5 9L11.5 13L9.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 17C7 17 8.5 16 12 16C15.5 16 17 17 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 5.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M5.5 12H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M19 12H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                }
                delay={1}
              />
            </div>
            
            {/* Crypto Payments */}
            <div className="col-span-6 md:col-span-2 row-span-1">
              <FeatureCard
                title="Crypto Payments"
                description="Payment is processed in crypto to pay for each verification request through Authentica."
                colorAccent="bg-gradient-to-r from-amber-500 to-orange-500"
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M15.5 9.5H10.5C9.67157 9.5 9 10.1716 9 11V11C9 11.8284 9.67157 12.5 10.5 12.5H13.5C14.3284 12.5 15 13.1716 15 14V14C15 14.8284 14.3284 15.5 13.5 15.5H8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 7.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 15.5V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                }
                delay={2}
              />
            </div>
            
            {/* NFT Credentials */}
            <div className="col-span-6 md:col-span-2 row-span-1">
              <FeatureCard
                title="NFT Credentials"
                description="Mint an NFT credential as proof of authenticity for human-created content."
                colorAccent="bg-gradient-to-r from-purple-600 to-pink-600"
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 20.0001H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M5 20.0001V11.0405C5 10.4883 5.29639 9.97359 5.78 9.66501L11.78 5.66501C12.3432 5.30156 13.0875 5.30156 13.6507 5.66501L19.6507 9.66501C20.1343 9.97359 20.4307 10.4883 20.4307 11.0405V20.0001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 20.0001H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                }
                delay={3}
              />
            </div>
            
            {/* Cross-chain Technology */}
            <div className="col-span-6 md:col-span-2 row-span-1">
              <FeatureCard
                title="Cross-chain Technology"
                description="Powered by World App, Metal, and Rootstock for secure, transparent verification."
                colorAccent="from-blue-500 to-indigo-600"
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 7H7C5.89543 7 5 7.89543 5 9V17C5 18.1046 5.89543 19 7 19H15C16.1046 19 17 18.1046 17 17V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 15H17C18.1046 15 19 14.1046 19 13V5C19 3.89543 18.1046 3 17 3H9C7.89543 3 7 3.89543 7 5V13C7 14.1046 7.89543 15 9 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                delay={4}
              />
              
              <div className="mt-4 flex items-center gap-3 justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="transition-transform"
                >
                  <Image
                    src="/world_logo.svg"
                    alt="World App"
                    width={48}
                    height={32}
                    className="w-12 h-8 bg-white p-1 border border-gray-100 shadow-sm object-contain"
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="transition-transform"
                >
                  <Image
                    src="/metal-logo.svg"
                    alt="Metal"
                    width={48}
                    height={32}
                    className="w-12 h-8 bg-white p-1 border border-gray-100 shadow-sm object-contain"
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="transition-transform"
                >
                  <Image
                    src="/rootstock-logo.png"
                    alt="Rootstock"
                    width={48}
                    height={32}
                    className="w-12 h-8 bg-white p-1 border border-gray-100 shadow-sm object-contain"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why is it needed? */}
      <section ref={newsRef} className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className={`
            text-center mb-16 
            ${sectionsReady && newsInView ? 'animate-smooth-appear' : 'opacity-0'}
          `}>
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900">Why is it needed?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              As AI-generated content becomes indistinguishable from human creations, verification tools are essential
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NewsCard 
              title="Rise in Academic Plagiarism"
              source="Nature"
              date="April 2023"
              summary="Universities report a 300% increase in AI-generated academic papers, raising concerns about academic integrity."
              imageUrl="/images/academic.jpg"
              delay={100}
            />
            <NewsCard 
              title="Fake News Proliferation"
              source="Reuters"
              date="March 2023"
              summary="AI tools are making it increasingly difficult to distinguish between real and fabricated news, threatening democracy."
              imageUrl="/images/fake-news.jpg"
              delay={200}
            />
            <NewsCard 
              title="Content Authenticity Crisis"
              source="The Guardian"
              date="May 2023"
              summary="Creative industries face existential challenge as AI-generated content floods markets without proper attribution."
              imageUrl="/images/content.jpg"
              delay={300}
            />
          </div>
        </div>
      </section>
      
      {/* Provider Competition */}
      <section ref={providersRef} className="py-16 md:py-24 bg-white">
        <div className={`
          container mx-auto px-4 max-w-6xl
          ${sectionsReady && providersInView ? 'animate-smooth-appear' : 'opacity-0'}
        `}>
          <ProviderSection />
        </div>
      </section>
      
      {/* How it Works */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <HowItWorks />
        </div>
      </section>
      
      {/* NFT Credentials */}
      <section className="py-10 md:py-16 bg-black text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <NFTCredential />
        </div>
      </section>
      
      {/* Watermarking Solutions */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-gray-900">Watermarking Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Authentica provides watermarking solutions for LLM hosting companies, with 99.9% accuracy within 100 tokens.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-semibold mb-4 text-black">Regulatory Compliance</h3>
              <p className="text-gray-600">
                Provide solutions for companies wanting to comply with regulations - soon companies will need verification systems to combat fake content.
              </p>
            </div>
            <div className="p-8 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-semibold mb-4 text-black">API Integration</h3>
              <p className="text-gray-600">
                Through Authentica APIs, we provide watermarking solutions for companies like OpenAI who can send LLM responses for watermarking based on research.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <CtaSection />
        </div>
      </section>
      
      {/* Scroll to top button */}
      <ScrollToTop />
    </div>
  );
} 