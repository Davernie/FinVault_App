import { useSpendingByCategory, useMonthlyTrends } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { PieChart as PieChartIcon, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

export default function Analytics() {
  const { data: spending, isLoading: spendingLoading } = useSpendingByCategory();
  const { data: trends, isLoading: trendsLoading } = useMonthlyTrends();

  const isLoading = spendingLoading || trendsLoading;

  const spendingChartConfig = useMemo<ChartConfig>(() => {
    if (!spending) return {};
    return Object.fromEntries(
      spending.map((item: any) => [
        item.categoryName,
        { label: item.categoryName, color: item.colorHex },
      ])
    );
  }, [spending]);

  const trendsChartConfig = useMemo<ChartConfig>(() => ({
    income: { label: "Income", color: "#22c55e" },
    expenses: { label: "Expenses", color: "#f43f5e" },
  }), []);

  const trendsData = useMemo(() => {
    if (!trends) return [];
    return trends.map((t: any) => ({
      month: t.month,
      income: t.income / 100,
      expenses: t.expenses / 100,
    }));
  }, [trends]);

  const pieData = useMemo(() => {
    if (!spending) return [];
    return spending.map((item: any) => ({
      name: item.categoryName,
      value: item.total / 100,
      fill: item.colorHex,
    }));
  }, [spending]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading analytics...</div>;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const hasSpending = pieData.length > 0;
  const hasTrends = trendsData.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Visualize your spending trends and income patterns.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        {/* Spending by Category - Donut Chart */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-lg font-semibold">Spending by Category</CardTitle>
              <div className="p-2 bg-background rounded-lg shadow-sm border border-border/50">
                <PieChartIcon className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {hasSpending ? (
                <ChartContainer config={spendingChartConfig} className="mx-auto aspect-square max-h-[350px]">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `€${Number(value).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
                          nameKey="name"
                        />
                      }
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold">No spending data</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">Make some transactions to see your spending breakdown.</p>
                </div>
              )}
              {hasSpending && (
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {pieData.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: entry.fill }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Income vs Expenses - Line Chart */}
        <motion.div variants={item}>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-lg font-semibold">Monthly Trends</CardTitle>
              <div className="p-2 bg-background rounded-lg shadow-sm border border-border/50">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {hasTrends ? (
                <ChartContainer config={trendsChartConfig} className="aspect-video max-h-[350px]">
                  <LineChart data={trendsData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        const [year, month] = value.split("-");
                        return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "short" });
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `€${Number(value).toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="var(--color-income)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-income)" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="var(--color-expenses)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-expenses)" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold">No trend data</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">Transaction history will show income vs expense trends over time.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
