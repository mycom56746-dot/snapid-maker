import React from 'react';
import Link from 'next/link';
import { Camera, Image as ImageIcon, FileText, Settings, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <header className="space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-primary rounded-2xl shadow-lg mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">SnapID Pro</h1>
          <p className="text-muted-foreground font-body text-lg">Professional passport photos made simple and offline.</p>
        </header>

        <main className="grid grid-cols-1 gap-4 mt-12">
          <Link href="/editor?source=camera" className="w-full">
            <Button size="lg" className="w-full h-20 text-lg rounded-2xl flex items-center justify-start px-6 gap-4 shadow-md bg-primary hover:bg-primary/90">
              <Camera className="w-6 h-6" />
              <div className="text-left">
                <span className="block font-bold">Capture Photo</span>
                <span className="text-xs font-normal opacity-80">Use device camera directly</span>
              </div>
            </Button>
          </Link>

          <Link href="/editor?source=gallery" className="w-full">
            <Button size="lg" variant="outline" className="w-full h-20 text-lg rounded-2xl flex items-center justify-start px-6 gap-4 border-2 hover:bg-white/50">
              <ImageIcon className="w-6 h-6 text-accent" />
              <div className="text-left">
                <span className="block font-bold text-foreground">Import from Gallery</span>
                <span className="text-xs font-normal text-muted-foreground">Select existing image</span>
              </div>
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-none shadow-sm bg-white/50">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <Zap className="w-6 h-6 text-accent" />
                <span className="text-xs font-medium">Quick Layouts</span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none shadow-sm bg-white/50">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <span className="text-xs font-medium">Privacy First</span>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="pt-8 text-muted-foreground text-xs flex items-center justify-center gap-4">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> v1.0.0</span>
          <span>•</span>
          <span>Made for Android</span>
        </footer>
      </div>
    </div>
  );
}
