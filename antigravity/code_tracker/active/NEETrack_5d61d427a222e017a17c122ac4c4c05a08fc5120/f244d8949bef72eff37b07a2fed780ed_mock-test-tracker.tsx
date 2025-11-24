­p'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { ClipboardList, PlusCircle, Trash2 } from 'lucide-react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

const testSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  physicsScore: z.coerce.number().min(0, 'Score must be positive').max(180),
  chemistryScore: z.coerce.number().min(0, 'Score must be positive').max(180),
  biologyScore: z.coerce.number().min(0, 'Score must be positive').max(360),
});

type TestFormValues = z.infer<typeof testSchema>;

type MockTest = {
  id: string;
  testName: string;
  physicsScore: number;
  chemistryScore: number;
  biologyScore: number;
  totalScore: number;
  createdAt: {
    toDate: () => Date;
  } | null;
  date?: Date; // Added for sorted tests
};

const chartConfig = {
  totalScore: {
    label: 'Total',
    color: 'hsl(var(--primary))',
  },
  physics: {
    label: 'Physics',
    color: 'hsl(var(--chart-1))',
  },
  chemistry: {
    label: 'Chemistry',
    color: 'hsl(var(--chart-2))',
  },
  biology: {
    label: 'Biology',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export default function MockTestTracker() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mockTestsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'mockTests') : null),
    [firestore, user]
  );
  const { data: mockTests, isLoading: isLoadingTests } =
    useCollection<MockTest>(mockTestsQuery);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testName: '',
      physicsScore: 0,
      chemistryScore: 0,
      biologyScore: 0,
    },
  });

  const onSubmit = async (values: TestFormValues) => {
    if (!user || !mockTestsQuery) return;
    const totalScore =
      values.physicsScore + values.chemistryScore + values.biologyScore;

    await addDocumentNonBlocking(mockTestsQuery, {
      ...values,
      totalScore,
      createdAt: serverTimestamp(),
      userId: user.uid,
    });

    form.reset();
    setIsDialogOpen(false);
  };

  const handleDeleteTest = (testId: string) => {
    if (!user) return;
    const testRef = doc(firestore, 'users', user.uid, 'mockTests', testId);
    deleteDocumentNonBlocking(testRef);
  }

  const sortedTests = useMemo(() => {
    if (!mockTests) return [];
    // Firestore returns a different Timestamp object than the client
    // so we need to normalize to JS Date.
    // Also, filter out tests where createdAt is still null (pending server timestamp).
    const testsWithDate = mockTests
      .filter(t => t.createdAt) // Ensure createdAt is not null
      .map(t => ({ ...t, date: t.createdAt!.toDate() }))

    return testsWithDate.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [mockTests]);

  const chartData = useMemo(() => {
    if (!sortedTests) return [];
    return sortedTests.map((test, index) => ({
      name: `Test ${index + 1}`,
      totalScore: test.totalScore,
      physics: test.physicsScore,
      chemistry: test.chemistryScore,
      biology: test.biologyScore,
    }));
  }, [sortedTests]);

  if (isUserLoading || isLoadingTests) {
    return (
      <Card className="w-full max-w-4xl bg-card/60 backdrop-blur-sm border-0 shadow-xl shadow-black/20">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl bg-card/60 backdrop-blur-sm border-0 shadow-xl shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-wider">
            <ClipboardList className="h-6 w-6 text-primary" />
            Mock Test Tracker
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Log and analyze your mock test performance.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Log New Test
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby="log-test-desc" aria-labelledby="log-test-title">
            <DialogHeader>
              <DialogTitle id="log-test-title">Log New Mock Test</DialogTitle>
              <DialogDescription id="log-test-desc">
                Enter your scores for each subject. The total will be calculated
                automatically.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="testName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Name / ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Aakash Mock Test 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="physicsScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Physics</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chemistryScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chemistry</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="biologyScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biology</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Save Test</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 720]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelClassName="font-bold"
                        className="bg-card/80 backdrop-blur-sm border-border/50"
                      />
                    }
                  />
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Line type="monotone" dataKey="totalScore" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} />
                  <Line type="monotone" dataKey="physics" stroke="hsl(var(--chart-1))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="chemistry" stroke="hsl(var(--chart-2))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="biology" stroke="hsl(var(--chart-3))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ChartContainer>
            </ResponsiveContainer>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/20">
              <TableHead>Test Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Physics</TableHead>
              <TableHead className="text-right">Chemistry</TableHead>
              <TableHead className="text-right">Biology</TableHead>
              <TableHead className="text-right font-bold text-primary">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTests.length > 0 ? (
              sortedTests.map((test) => (
                <TableRow key={test.id} className="border-border/10">
                  <TableCell className="font-medium">{test.testName}</TableCell>
                  <TableCell className="text-muted-foreground">{format(test.date, 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    {test.physicsScore}
                  </TableCell>
                  <TableCell className="text-right">
                    {test.chemistryScore}
                  </TableCell>
                  <TableCell className="text-right">
                    {test.biologyScore}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {test.totalScore}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this mock test score.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTest(test.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No mock tests logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
­p*cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc51202Ffile:///c:/Apps/NEETrack/NEETrack/src/components/mock-test-tracker.tsx:!file:///c:/Apps/NEETrack/NEETrack