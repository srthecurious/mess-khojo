õv'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, TestTube, Atom } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';
import { CircularProgress } from '@/components/ui/circular-progress';

const initialSyllabus = [
  {
    id: 'physics',
    name: 'Physics',
    icon: <Atom className="h-5 w-5" />,
    chapters: [
      { id: 'p1', name: 'Physics and Measurement', completed: false },
      { id: 'p2_1', name: 'Motion in 1D', completed: false },
      { id: 'p2_2', name: 'Motion in 2D', completed: false },
      { id: 'p3', name: 'Laws of Motion', completed: false },
      { id: 'p4', name: 'Work, Energy, and Power', completed: false },
      { id: 'p5', name: 'Rotational Motion', completed: false },
      { id: 'p6', name: 'Gravitation', completed: false },
      { id: 'p7_1', name: 'Properties of Solids', completed: false },
      { id: 'p7_2', name: 'Properties of Liquids', completed: false },
      { id: 'p8', name: 'Thermodynamics', completed: false },
      { id: 'p9', name: 'Kinetic Theory of Gases', completed: false },
      { id: 'p10_1', name: 'Oscillations', completed: false },
      { id: 'p10_2', name: 'Waves', completed: false },
      { id: 'p11', name: 'Electrostatics', completed: false },
      { id: 'p12', name: 'Current Electricity', completed: false },
      { id: 'p13_1', name: 'Magnetic Effects of Current', completed: false },
      { id: 'p13_2', name: 'Magnetism', completed: false },
      { id: 'p14_1', name: 'Electromagnetic Induction', completed: false },
      { id: 'p14_2', name: 'Alternating Current', completed: false },
      { id: 'p15', name: 'Electromagnetic Waves', completed: false },
      { id: 'p16', name: 'Optics', completed: false },
      { id: 'p17', name: 'Dual Nature of Matter and Radiation', completed: false },
      { id: 'p18_1', name: 'Atoms', completed: false },
      { id: 'p18_2', name: 'Nuclei', completed: false },
      { id: 'p19', name: 'Electronic Devices', completed: false },
      { id: 'p20', name: 'Experimental Skills', completed: false },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: <TestTube className="h-5 w-5" />,
    chapters: [
      { id: 'c1', name: 'Some Basic Concepts in Chemistry', completed: false },
      { id: 'c2', name: 'Atomic Structure', completed: false },
      { id: 'c3', name: 'Chemical Bonding and Molecular Structure', completed: false },
      { id: 'c4', name: 'Chemical Thermodynamics', completed: false },
      { id: 'c5', name: 'Solutions', completed: false },
      { id: 'c6', name: 'Equilibrium', completed: false },
      { id: 'c7', name: 'Redox Reactions and Electrochemistry', completed: false },
      { id: 'c8', name: 'Chemical Kinetics', completed: false },
      { id: 'c9', name: 'Classification of Elements and Periodicity in Properties', completed: false },
      { id: 'c10', name: 'p-Block Elements', completed: false },
      { id: 'c11', name: 'd- and f-Block Elements', completed: false },
      { id: 'c12', name: 'Coordination Compounds', completed: false },
      { id: 'c13', name: 'Purification and Characterisation of Organic Compounds', completed: false },
      { id: 'c14', name: 'Some Basic Principles of Organic Chemistry', completed: false },
      { id: 'c15', name: 'Hydrocarbons', completed: false },
      { id: 'c16', name: 'Organic Compounds Containing Halogens', completed: false },
      { id: 'c17', name: 'Organic Compounds Containing Oxygen', completed: false },
      { id: 'c18', name: 'Organic Compounds Containing Nitrogen', completed: false },
      { id: 'c19', name: 'Biomolecules', completed: false },
      { id: 'c20', 'name': 'Principles Related to Practical Chemistry', completed: false },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: <Target className="h-5 w-5" />,
    chapters: [
      { id: 'b1-1', name: 'The Living World', completed: false },
      { id: 'b1-2', name: 'Biological Classification', completed: false },
      { id: 'b1-3', name: 'Plant Kingdom', completed: false },
      { id: 'b1-4', name: 'Animal Kingdom', completed: false },
      { id: 'b2-1', name: 'Morphology of Flowering Plants', completed: false },
      { id: 'b2-2', name: 'Anatomy of Flowering Plants', completed: false },
      { id: 'b2-3', name: 'Structural Organisation in Animals', completed: false },
      { id: 'b3-1', name: 'Cell: The Unit of Life', completed: false },
      { id: 'b3-2', name: 'Biomolecules', completed: false },
      { id: 'b3-3', name: 'Cell Cycle and Cell Division', completed: false },
      { id: 'b4-3', name: 'Photosynthesis in Higher Plants', completed: false },
      { id: 'b4-4', name: 'Respiration in Plants', completed: false },
      { id: 'b4-5', name: 'Plant Growth and Development', completed: false },
      { id: 'b5-2', name: 'Breathing and Exchange of Gases', completed: false },
      { id: 'b5-3', name: 'Body Fluids and Circulation', completed: false },
      { id: 'b5-4', name: 'Excretory Products and their Elimination', completed: false },
      { id: 'b5-5', name: 'Locomotion and Movement', completed: false },
      { id: 'b5-6', name: 'Neural Control and Coordination', completed: false },
      { id: 'b5-7', name: 'Chemical Coordination and Integration', completed: false },
      { id: 'b6-2', name: 'Sexual Reproduction in Flowering Plants', completed: false },
      { id: 'b6-3', name: 'Human Reproduction', completed: false },
      { id: 'b6-4', name: 'Reproductive Health', completed: false },
      { id: 'b7-1', name: 'Principles of Inheritance and Variation', completed: false },
      { id: 'b7-2', name: 'Molecular Basis of Inheritance', completed: false },
      { id: 'b7-3', name: 'Evolution', completed: false },
      { id: 'b8-1-1', name: 'Human Health and Disease', completed: false },
      { id: 'b8-2', name: 'Strategies for Enhancement in Food Production', completed: false },
      { id: 'b8-3', 'name': 'Microbes in Human Welfare', completed: false },
      { id: 'b9-1', name: 'Biotechnology: Principles and Processes', completed: false },
      { id: 'b9-2', name: 'Biotechnology and its Applications', completed: false },
      { id: 'b10-1', name: 'Organisms and Populations', completed: false },
      { id: 'b10-2', name: 'Ecosystem', completed: false },
      { id: 'b10-3', name: 'Biodiversity and its Conservation', completed: false },
      { id: 'b10-4', name: 'Environmental Issues', completed: false },
    ],
  },
];

type Chapter = {
  id: string;
  name: string;
  completed: boolean;
};

type Subject = {
  id: string;
  name: string;
  icon: React.ReactNode;
  chapters: Chapter[];
};

type UserChapterCompletion = {
  id?: string;
  userId: string;
  chapterId: string;
  isCompleted: boolean;
  completionDate: string;
}

const SyllabusTracker = () => {
  const [syllabus, setSyllabus] = useState<Subject[]>(initialSyllabus);

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const chapterCompletionsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'chapterCompletions') : null),
    [firestore, user]
  );

  const { data: chapterCompletions, isLoading: isLoadingCompletions } = useCollection<UserChapterCompletion>(chapterCompletionsQuery);

  useEffect(() => {
    if (!isLoadingCompletions) {
      const completionMap = new Map<string, boolean>();
      if (chapterCompletions) {
        chapterCompletions.forEach(comp => {
          if (comp.isCompleted) {
            completionMap.set(comp.chapterId, comp.isCompleted);
          }
        });
      }

      const updatedSyllabus = initialSyllabus.map(subject => ({
        ...subject,
        chapters: subject.chapters.map(chapter => ({
          ...chapter,
          completed: completionMap.has(chapter.id)
        }))
      }));
      setSyllabus(updatedSyllabus);
    }
  }, [chapterCompletions, isLoadingCompletions]);

  const handleChapterToggle = (subjectId: string, chapterId: string, isChecked: boolean) => {
    if (!user) return;

    setSyllabus((prevSyllabus) =>
      prevSyllabus.map((subject) => {
        if (subject.id === subjectId) {
          return {
            ...subject,
            chapters: subject.chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return { ...chapter, completed: isChecked };
              }
              return chapter;
            }),
          };
        }
        return subject;
      })
    );

    const completionRef = doc(firestore, 'users', user.uid, 'chapterCompletions', chapterId);
    const data: UserChapterCompletion = {
      userId: user.uid,
      chapterId: chapterId,
      isCompleted: isChecked,
      completionDate: new Date().toISOString(),
    };
    setDocumentNonBlocking(completionRef, data, { merge: true });
  };

  const getSubjectProgress = (chapters: Chapter[]) => {
    if (chapters.length === 0) return 0;
    const completedChapters = chapters.filter(chap => chap.completed).length;
    return (completedChapters / chapters.length) * 100;
  };

  const getOverallProgress = () => {
    const allChapters = syllabus.flatMap(s => s.chapters);
    if (allChapters.length === 0) return 0;
    const completedChapters = allChapters.filter(c => c.completed).length;
    return (completedChapters / allChapters.length) * 100;
  }

  const isLoading = isUserLoading || isLoadingCompletions;

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl bg-card border-border shadow-2xl shadow-black/50">
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 flex items-center justify-center">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallProgress = getOverallProgress();

  return (
    <Card className="w-full max-w-4xl bg-card border-border shadow-2xl shadow-black/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          Syllabus Tracker
        </CardTitle>
        <div className="pt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-semibold text-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2 bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center justify-center md:col-span-1">
            <div className="relative size-48">
              <CircularProgress value={overallProgress} size={192} strokeWidth={12} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-foreground drop-shadow-[0_2px_4px_hsl(var(--primary)_/_0.5)]">
                  {Math.round(overallProgress)}%
                </span>
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
            </div>
          </div>
          <div className="space-y-4 md:col-span-2">
            <Accordion type="single" collapsible className="w-full">
              {syllabus.map((subject) => {
                const subjectProgress = getSubjectProgress(subject.chapters);
                return (
                  <AccordionItem value={subject.id} key={subject.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4 w-full">
                        <div className="text-primary">{subject.icon}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{subject.name}</span>
                            <span className="text-sm font-medium text-muted-foreground">{Math.round(subjectProgress)}%</span>
                          </div>
                          <Progress value={subjectProgress} className="h-1.5 mt-1 bg-muted" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 py-2 pl-9">
                        {subject.chapters.map((chapter) => (
                          <div key={chapter.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                            <Checkbox
                              id={`${subject.id}-${chapter.id}`}
                              checked={chapter.completed}
                              onCheckedChange={(checked) =>
                                handleChapterToggle(subject.id, chapter.id, !!checked)
                              }
                              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                            />
                            <label
                              htmlFor={`${subject.id}-${chapter.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/70"
                            >
                              {chapter.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>

      </CardContent>
    </Card >
  );
};

export default SyllabusTracker;
õv"(c3a39cef2b9afd8776f0d208ad342f6993b0b2532Efile:///c:/Apps/NEETrack/NEETrack/src/components/syllabus-tracker.tsx:!file:///c:/Apps/NEETrack/NEETrack