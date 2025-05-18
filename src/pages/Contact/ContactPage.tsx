import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import emailjs from '@emailjs/browser';

export default function ContactPage() {
  const { toast } = useToast();
  const form = React.useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.current) return;

    // Replace these with your actual EmailJS credentials
    const serviceID = 'service_fy10afq';
    const templateID = 'template_nttt2gt';
    const publicKey = 'mvfih0lJxcqeoPZql';

    emailjs.sendForm(serviceID, templateID, form.current, publicKey)
      .then((result) => {
        toast({
          title: "Message sent successfully",
          description: "We'll get back to you as soon as possible.",
        });
        form.current?.reset();
      }, (error) => {
        toast({
          title: "Failed to send message",
          description: error.text || "Please try again later.",
          variant: "destructive"
        });
      });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4"
    >
      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>
            Have a question or concern? We're here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={form} onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">Name</label>
              <Input 
                id="name" 
                name="from_name" 
                placeholder="Your name" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input 
                id="email" 
                type="email" 
                name="from_email" 
                placeholder="Your email" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="message">How can we help?</label>
              <Textarea 
                id="message" 
                name="message" 
                placeholder="Tell us about your issue or question"
                className="min-h-[150px]"
                required 
              />
            </div>
            
            <Button type="submit" className="w-full bg-appPurple hover:bg-appSecondary">
              Submit
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}