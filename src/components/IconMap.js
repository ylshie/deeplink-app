import {
  Link,
  Bitcoin,
  Brain,
  TrendingUp,
  Shield,
  Eye,
  BarChart3,
  Activity,
  Gem,
  ChartBar,
  Wallet,
  RotateCcw,
  HelpCircle,
} from 'lucide-react-native';

const map = {
  link: Link,
  bitcoin: Bitcoin,
  brain: Brain,
  'trending-up': TrendingUp,
  shield: Shield,
  eye: Eye,
  'bar-chart-3': BarChart3,
  activity: Activity,
  gem: Gem,
  'chart-bar': ChartBar,
  wallet: Wallet,
  'rotate-ccw': RotateCcw,
};

/**
 * Resolve a lucide icon name string to its React Native component.
 */
export function getIcon(name) {
  return map[name] || HelpCircle;
}
