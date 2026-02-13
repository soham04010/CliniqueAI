import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming you installed Shadcn Button

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">CliniqueAI</h1>
      <div className="flex gap-4">
        <Link href="/doctor">
          <Button className="bg-blue-600 hover:bg-blue-700 h-16 w-40 text-lg">
            Doctor Login
          </Button>
        </Link>
        <Link href="/patient">
          <Button variant="outline" className="h-16 w-40 text-lg border-blue-600 text-blue-600">
            Patient Login
          </Button>
        </Link>
      </div>
    </main>
  );
}