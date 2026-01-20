import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GlobalNav } from '@/components/GlobalNav';
import { AppFooter } from '@/components/AppFooter';
import { z } from 'zod';

const emailSchema = z.string().email().max(255).optional().or(z.literal(''));

export default function Feedback() {
  const { user, isAnonymous } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Optional field
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    if (!validateEmail(contactEmail)) {
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('feedback')
      .insert({ 
        user_id: user!.id, 
        message: message.trim(),
        contact_email: contactEmail.trim() || null
      });
    
    setIsSubmitting(false);
    
    if (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error('Feedback error:', error);
    } else {
      setSubmitted(true);
      toast.success('Feedback submitted successfully!');
    }
  };

  // Not logged in or anonymous
  if (!user || isAnonymous) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalNav />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md"
          >
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl tracking-wider text-foreground">
              SIGN IN REQUIRED
            </h1>
            <p className="text-muted-foreground">
              Create an account to share your feedback and help us improve.
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="font-mono uppercase tracking-wider"
            >
              Sign In / Sign Up
            </Button>
          </motion.div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // Successfully submitted
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <GlobalNav />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md"
          >
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl tracking-wider text-foreground">
              FEEDBACK RECEIVED
            </h1>
            <p className="text-muted-foreground">
              Thank you for helping us improve. Your feedback has been sent to our team.
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>
        </main>
        <AppFooter />
      </div>
    );
  }

  // Feedback form
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalNav />
      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="space-y-2">
            <h1 className="font-display text-3xl tracking-wider text-foreground">
              SEND FEEDBACK
            </h1>
            <p className="text-muted-foreground">
              We'd love to hear from you. Share suggestions, report issues, or tell us what you think.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="message" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                Your Feedback
              </label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="min-h-[200px] resize-none bg-muted/50 border-border focus:border-primary"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/2000
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                Email (Optional)
              </label>
              <Input
                id="email"
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(contactEmail)}
                placeholder="your@email.com"
                className="bg-muted/50 border-border focus:border-primary"
                maxLength={255}
              />
              {emailError ? (
                <p className="text-xs text-destructive">{emailError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Leave your email if you'd like us to follow up
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full font-mono uppercase tracking-wider"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </main>
      <AppFooter />
    </div>
  );
}
