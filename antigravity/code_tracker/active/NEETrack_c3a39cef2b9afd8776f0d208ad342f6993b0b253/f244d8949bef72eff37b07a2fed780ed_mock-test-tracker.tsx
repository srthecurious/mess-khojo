ся'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, PlusCircle, Trash2, Pencil, X } from 'lucide-react';
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';

const syllabusItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Chapter name is required'),
  completed: z.boolean().default(false),
});

const testSchema = z.object({
  testName: z.string().min(1, 'Test name is required'),
  examDate: z.date({
    required_error: 'Exam date is required',
  }),
  physicsScore: z.coerce.number().min(0, 'Score must be positive').max(180),
  chemistryScore: z.coerce.number().min(0, 'Score must be positive').max(180),
  biologyScore: z.coerce.number().min(0, 'Score must be positive').max(360),
  syllabus: z.array(syllabusItemSchema).min(1, 'Add at least one chapter'),
});

type TestFormValues = z.infer<typeof testSchema>;
type SyllabusItem = z.infer<typeof syllabusItemSchema>;

type MockTest = {
  id: string;
  testName: string;
  examDate: {
    toDate: () => Date;
  } | Date;
  physicsScore: number;
  chemistryScore: number;
  biologyScore: number;
  totalScore: number;
  syllabus: SyllabusItem[];
  createdAt: {
    toDate: () => Date;
  } | null;
  date?: Date; // Added for sorted tests
  examDateObj?: Date; // Parsed exam date
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

  const [editingTest, setEditingTest] = useState<MockTest | null>(null);
  const [syllabusInput, setSyllabusInput] = useState('');

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testName: '',
      examDate: new Date(),
      physicsScore: 0,
      chemistryScore: 0,
      biologyScore: 0,
      syllabus: [],
    },
  });

  // Reset form and editing state when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTest(null);
      form.reset({
        testName: '',
        examDate: new Date(),
        physicsScore: 0,
        chemistryScore: 0,
        biologyScore: 0,
        syllabus: [],
      });
      setSyllabusInput('');
    }
  };

  const onSubmit = async (values: TestFormValues) => {
    if (!user || !mockTestsQuery) return;
    const totalScore =
      values.physicsScore + values.chemistryScore + values.biologyScore;

    const testData = {
      ...values,
      totalScore,
      userId: user.uid,
      ...(editingTest ? {} : { createdAt: serverTimestamp() }),
    };

    if (editingTest) {
      // Update existing test
      const testRef = doc(firestore, 'users', user.uid, 'mockTests', editingTest.id);
      await updateDocumentNonBlocking(testRef, testData);
    } else {
      // Create new test
      await addDocumentNonBlocking(mockTestsQuery, {
        ...testData,
        createdAt: serverTimestamp(),
      });
    }

    form.reset();
    setEditingTest(null);
    setIsDialogOpen(false);
  };

  const handleDeleteTest = (testId: string) => {
    if (!user) return;
    const testRef = doc(firestore, 'users', user.uid, 'mockTests', testId);
    deleteDocumentNonBlocking(testRef);
  };

  const handleEditTest = (test: MockTest) => {
    setEditingTest(test);
    const examDateValue = test.examDate instanceof Date
      ? test.examDate
      : test.examDate?.toDate?.() || new Date();

    form.reset({
      testName: test.testName,
      examDate: examDateValue,
      physicsScore: test.physicsScore,
      chemistryScore: test.chemistryScore,
      biologyScore: test.biologyScore,
      syllabus: test.syllabus || [],
    });
    setIsDialogOpen(true);
  };

  const handleAddSyllabusItem = () => {
    const currentSyllabus = form.getValues('syllabus') || [];
    if (syllabusInput.trim()) {
      form.setValue('syllabus', [
        ...currentSyllabus,
        {
          id: `${Date.now()}-${Math.random()}`,
          name: syllabusInput.trim(),
          completed: false,
        },
      ]);
      setSyllabusInput('');
    }
  };

  const handleRemoveSyllabusItem = (id: string) => {
    const currentSyllabus = form.getValues('syllabus') || [];
    form.setValue(
      'syllabus',
      currentSyllabus.filter((item) => item.id !== id)
    );
  };

  const handleToggleSyllabusCompletion = async (testId: string, syllabusId: string) => {
    if (!user) return;
    const test = mockTests?.find((t) => t.id === testId);
    if (!test) return;

    const updatedSyllabus = test.syllabus.map((item) =>
      item.id === syllabusId ? { ...item, completed: !item.completed } : item
    );

    const testRef = doc(firestore, 'users', user.uid, 'mockTests', testId);
    await updateDocumentNonBlocking(testRef, {
      syllabus: updatedSyllabus,
    });
  };

  const sortedTests = useMemo(() => {
    if (!mockTests) return [];
    // Firestore returns a different Timestamp object than the client
    // so we need to normalize to JS Date.
    // Also, filter out tests where createdAt is still null (pending server timestamp).
    const testsWithDate = mockTests
      .filter(t => t.createdAt) // Ensure createdAt is not null
      .map(t => ({
        ...t,
        date: t.createdAt!.toDate(),
        examDateObj: t.examDate instanceof Date ? t.examDate : t.examDate?.toDate?.() || new Date(),
      }))

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

  const nextExamForQuote = useMemo(() => {
    if (!sortedTests) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTests = sortedTests
      .filter(test => {
        if (!test.syllabus || test.syllabus.length === 0) return false;
        const examDate = test.examDateObj || new Date();
        examDate.setHours(0, 0, 0, 0);
        return examDate >= today;
      })
      .sort((a, b) => {
        const dateA = a.examDateObj?.getTime() || 0;
        const dateB = b.examDateObj?.getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        const createdA = a.date?.getTime() || 0;
        const createdB = b.date?.getTime() || 0;
        return createdB - createdA;
      });

    return upcomingTests[0] || null;
  }, [sortedTests]);

  const motivationalQuote = useMemo(() => {
    if (!nextExamForQuote || !nextExamForQuote.syllabus || nextExamForQuote.syllabus.length === 0) return null;

    const total = nextExamForQuote.syllabus.length;
    const completed = nextExamForQuote.syllabus.filter(s => s.completed).length;
    const percentage = (completed / total) * 100;

    if (percentage === 0) return "Every expert was once a beginner. Start now!";
    if (percentage < 25) return "Small steps lead to big changes. Keep going!";
    if (percentage < 50) return "You're making progress! Consistency is key.";
    if (percentage < 75) return "Great work! You're well on your way to mastery.";
    if (percentage < 100) return "Almost there! One last push to the finish line.";
    return "Outstanding! You're ready to crush this exam!";
  }, [nextExamForQuote]);

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
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Log New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTest ? 'Edit Mock Test' : 'Log New Mock Test'}
              </DialogTitle>
              <DialogDescription>
                Enter exam details, syllabus chapters, and scores. The total will be calculated automatically.
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

                <FormField
                  control={form.control}
                  name="examDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Exam Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value instanceof Date && !isNaN(field.value.getTime())
                              ? field.value.toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            if (!isNaN(date.getTime())) {
                              field.onChange(date);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Syllabus Chapters</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add chapter name"
                      value={syllabusInput}
                      onChange={(e) => setSyllabusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSyllabusItem();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddSyllabusItem}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name="syllabus"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {field.value && field.value.length > 0 ? (
                              field.value.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between bg-muted/50 p-2 rounded"
                                >
                                  <span className="text-sm">{item.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSyllabusItem(item.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No chapters added yet</p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  <Button type="submit">{editingTest ? 'Update Test' : 'Save Test'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {motivationalQuote && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center animate-in fade-in slide-in-from-top-4 duration-500">
            <p className="text-lg font-medium text-primary italic">"{motivationalQuote}"</p>
          </div>
        )}
        {/* Syllabus Overview Section - Only Nearest Upcoming Exam */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const upcomingTests = sortedTests
            .filter(test => {
              if (!test.syllabus || test.syllabus.length === 0) return false;
              const examDate = test.examDateObj || new Date();
              examDate.setHours(0, 0, 0, 0);
              return examDate >= today;
            })
            .sort((a, b) => {
              // Primary sort: Exam Date Ascending
              const dateA = a.examDateObj?.getTime() || 0;
              const dateB = b.examDateObj?.getTime() || 0;
              if (dateA !== dateB) return dateA - dateB;

              // Secondary sort: Created At Descending (Newest first)
              const createdA = a.date?.getTime() || 0;
              const createdB = b.date?.getTime() || 0;
              return createdB - createdA;
            });

          const nextExam = upcomingTests[0];

          if (!nextExam) return null;

          return (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Upcoming Exam Syllabus</h3>
              <div className="space-y-4">
                <div key={nextExam.id} className="border border-border/30 rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-primary">{nextExam.testName}</h4>
                    <span className="text-xs text-muted-foreground">
                      {nextExam.examDateObj ? format(nextExam.examDateObj, 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {nextExam.syllabus.map((chapter) => (
                      <label
                        key={chapter.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={chapter.completed}
                          onChange={() => handleToggleSyllabusCompletion(nextExam.id, chapter.id)}
                          className="rounded border-primary text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className={chapter.completed ? 'line-through text-muted-foreground' : ''}>
                          {chapter.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
              <TableHead>Exam Date</TableHead>
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
                  <TableCell className="text-muted-foreground">
                    {test.examDateObj ? format(test.examDateObj, 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
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
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTest(test)}
                      >
                        <Pencil className="h-4 w-4 text-primary/70 hover:text-primary" />
                      </Button>
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
                    </div>
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
      </CardContent >
    </Card >
  );
}
ся"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Ffile:///c:/Apps/NEETrack/NEETrack/src/components/mock-test-tracker.tsx:!file:///c:/Apps/NEETrack/NEETrack