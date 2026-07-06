import {
  Briefcase,
  TrainFront,
  Beef,
  Landmark,
  ShieldCheck,
  Ship,
  Tractor,
  TrendingUp,
  Shield,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  TrainFront,
  Beef,
  Landmark,
  ShieldCheck,
  Ship,
  Tractor,
  TrendingUp,
  Shield,
};

export default function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} />;
}
