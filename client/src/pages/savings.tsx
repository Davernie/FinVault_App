import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from "@/hooks/use-savings-goals";
import { Currency } from "@/components/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Plus, PiggyBank, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  deadline: z.string().optional(),
});

const contributeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

export default function Savings() {
  const { data: goals, isLoading } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();

  const [createOpen, setCreateOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<any | null>(null);

  const createForm = useForm<z.infer<typeof createGoalSchema>>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: { name: "", targetAmount: 0, deadline: "" },
  });

  const contributeForm = useForm<z.infer<typeof contributeSchema>>({
    resolver: zodResolver(contributeSchema),
    defaultValues: { amount: 0 },
  });

  function onCreateSubmit(values: z.infer<typeof createGoalSchema>) {
    createGoal.mutate({
      name: values.name,
      targetAmount: Math.round(values.targetAmount * 100),
      deadline: values.deadline || null,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        createForm.reset();
      },
    });
  }

  function onContributeSubmit(values: z.infer<typeof contributeSchema>) {
    if (!contributeGoal) return;
    updateGoal.mutate({
      id: contributeGoal.id,
      currentAmount: contributeGoal.currentAmount + Math.round(values.amount * 100),
    }, {
      onSuccess: () => {
        setContributeGoal(null);
        contributeForm.reset();
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track progress toward your financial goals.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>Set a target amount and optional deadline for your goal.</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Emergency Fund" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount (EUR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4" disabled={createGoal.isPending}>
                  {createGoal.isPending ? "Saving..." : "Create Goal"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contribute Dialog */}
      <Dialog open={!!contributeGoal} onOpenChange={(open) => { if (!open) { setContributeGoal(null); contributeForm.reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute to {contributeGoal?.name}</DialogTitle>
            <DialogDescription>
              Current progress: <Currency valueInCents={contributeGoal?.currentAmount ?? 0} /> of <Currency valueInCents={contributeGoal?.targetAmount ?? 0} />
            </DialogDescription>
          </DialogHeader>
          <Form {...contributeForm}>
            <form onSubmit={contributeForm.handleSubmit(onContributeSubmit)} className="space-y-4 pt-4">
              <FormField
                control={contributeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (EUR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-4" disabled={updateGoal.isPending}>
                {updateGoal.isPending ? "Saving..." : "Add Contribution"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground animate-pulse">Loading goals...</div>
        ) : goals?.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center">
            <PiggyBank className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No savings goals yet</h3>
            <p className="text-muted-foreground max-w-sm mt-2">Create your first goal to start saving toward something meaningful.</p>
          </div>
        ) : (
          goals?.map((goal: any, index: number) => {
            const percent = goal.targetAmount > 0
              ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              : 0;
            const isComplete = percent >= 100;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      {isComplete && (
                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Saved: <Currency valueInCents={goal.currentAmount} className="text-foreground font-medium" />
                        </span>
                        <span className="text-muted-foreground">
                          Target: <Currency valueInCents={goal.targetAmount} className="font-medium" />
                        </span>
                      </div>
                      <Progress value={percent} className="h-2.5" />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {percent.toFixed(0)}% reached
                        </span>
                        {!isComplete && (
                          <span className="text-muted-foreground">
                            <Currency valueInCents={goal.targetAmount - goal.currentAmount} /> remaining
                          </span>
                        )}
                      </div>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground">
                          Deadline: {format(new Date(goal.deadline), "MMM d, yyyy")}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        {!isComplete && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setContributeGoal(goal)}
                          >
                            Contribute
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{goal.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteGoal.mutate(goal.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
