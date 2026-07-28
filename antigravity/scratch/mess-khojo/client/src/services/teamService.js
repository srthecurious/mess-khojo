import { db, storage } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

const COLLECTION_NAME = 'team_members';

// Default seed members representing all required team roles
export const INITIAL_TEAM_MEMBERS = [
  {
    id: "MK-FND-001",
    name: "Aditya Kumar Nayak",
    role: "Founder & CEO",
    roleCategory: "founder",
    categoryLabel: "Leadership",
    department: "Executive & Strategy",
    email: "aditya@messkhojo.com",
    linkedin: "https://linkedin.com/in/adityanayak",
    twitter: "https://twitter.com/adityanayak",
    github: "https://github.com/adityanayak",
    bio: "Pioneered MessKhojo to solve student housing challenges across Odisha. Drives overall strategy, vision, and growth.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    skills: ["Product Strategy", "Venture Growth", "Operations", "Leadership"],
    joinedDate: "2024-01-01",
    status: "Active"
  },
  {
    id: "MK-COF-001",
    name: "Rohan Samal",
    role: "Co-Founder & COO",
    roleCategory: "co_founder",
    categoryLabel: "Leadership",
    department: "Operations & Partnerships",
    email: "rohan@messkhojo.com",
    linkedin: "https://linkedin.com/in/rohansamal",
    twitter: "https://twitter.com/rohansamal",
    bio: "Oversees ground operations, mess owner onboarding, and regional expansion in Balasore and Bhadrak.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    skills: ["Vendor Management", "Business Operations", "Expansion"],
    joinedDate: "2024-01-15",
    status: "Active"
  },
  {
    id: "MK-CTO-001",
    name: "Subham Das",
    role: "Chief Technology Officer (CTO)",
    roleCategory: "cto",
    categoryLabel: "Leadership",
    department: "Engineering & Architecture",
    email: "cto@messkhojo.com",
    linkedin: "https://linkedin.com/in/subhamdas",
    github: "https://github.com/subhamdas",
    bio: "Leads frontend, backend, and cloud infrastructure. Architect of MessKhojo web app, SEO engine, and mobile app.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    skills: ["React", "Firebase", "Node.js", "System Architecture", "Cloud Infrastructure"],
    joinedDate: "2024-02-01",
    status: "Active"
  },
  {
    id: "MK-CFO-001",
    name: "Ananya Mishra",
    role: "Chief Financial Officer (CFO)",
    roleCategory: "cfo",
    categoryLabel: "Leadership",
    department: "Finance & Accounting",
    email: "cfo@messkhojo.com",
    linkedin: "https://linkedin.com/in/ananyamishra",
    bio: "Manages financial planning, budget allocations, compliance, and investor relations for MessKhojo.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    skills: ["Financial Analysis", "Corporate Finance", "Budgeting", "Auditing"],
    joinedDate: "2024-03-01",
    status: "Active"
  },
  {
    id: "MK-CMO-001",
    name: "Priya Mohanty",
    role: "Chief Marketing Officer (CMO)",
    roleCategory: "cmo",
    categoryLabel: "Leadership",
    department: "Marketing & Growth",
    email: "cmo@messkhojo.com",
    linkedin: "https://linkedin.com/in/priyamohanty",
    twitter: "https://twitter.com/priyamohanty",
    bio: "Spearheads digital marketing campaigns, brand identity, student outreach programs, and social media engagement.",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80",
    skills: ["Growth Hacking", "SEO & SEM", "Brand Management", "Content Strategy"],
    joinedDate: "2024-03-15",
    status: "Active"
  },
  {
    id: "MK-FPT-001",
    name: "Soumya Ranjan Tripathy",
    role: "Founding Partner",
    roleCategory: "founding_partner",
    categoryLabel: "Founding Partner",
    department: "Strategic Partnerships",
    email: "soumya@messkhojo.com",
    linkedin: "https://linkedin.com/in/soumyatripathy",
    bio: "Early strategic advisor and partner instrumental in establishing college partnerships and key regional networks.",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
    skills: ["Institutional Partnerships", "Strategic Advisory", "Network Growth"],
    joinedDate: "2024-01-10",
    status: "Active"
  },
  {
    id: "MK-EMP-001",
    name: "Deepak Sahoo",
    role: "Senior Full Stack Engineer",
    roleCategory: "employee",
    categoryLabel: "Employees",
    department: "Engineering",
    email: "deepak@messkhojo.com",
    github: "https://github.com/deepaksahoo",
    linkedin: "https://linkedin.com/in/deepaksahoo",
    bio: "Builds core booking workflows, operational dashboards, and database optimizations.",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80",
    skills: ["React.js", "TailwindCSS", "Firestore", "REST APIs"],
    joinedDate: "2024-05-01",
    status: "Active"
  },
  {
    id: "MK-EMP-002",
    name: "Sneha Pattnaik",
    role: "UI/UX & Visual Designer",
    roleCategory: "employee",
    categoryLabel: "Employees",
    department: "Design",
    email: "sneha@messkhojo.com",
    linkedin: "https://linkedin.com/in/snehapattnaik",
    bio: "Crafts intuitive UI components, micro-animations, and visual brand assets for the website and mobile apps.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    skills: ["Figma", "UI Design", "Glassmorphism", "Design Systems"],
    joinedDate: "2024-06-15",
    status: "Active"
  },
  {
    id: "MK-INT-001",
    name: "Ayush Rout",
    role: "Frontend Development Intern",
    roleCategory: "intern",
    categoryLabel: "Interns",
    department: "Engineering",
    email: "ayush.intern@messkhojo.com",
    github: "https://github.com/ayushrout",
    linkedin: "https://linkedin.com/in/ayushrout",
    bio: "Assists in building responsive UI pages, accessibility fixes, and client-side performance testing.",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    skills: ["JavaScript", "React", "HTML5/CSS3"],
    joinedDate: "2025-01-10",
    status: "Active"
  },
  {
    id: "MK-INT-002",
    name: "Rashmi Ranjan Jena",
    role: "Operations & Onboarding Intern",
    roleCategory: "intern",
    categoryLabel: "Interns",
    department: "Operations",
    email: "rashmi.intern@messkhojo.com",
    linkedin: "https://linkedin.com/in/rashmijena",
    bio: "Helps verify mess listings, gather student feedback, and support operational verification calls.",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    skills: ["Field Verification", "Customer Relations", "Data Verification"],
    joinedDate: "2025-02-01",
    status: "Active"
  }
];

// Fetch all team members strictly from Firestore
export const fetchTeamMembers = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("joinedDate", "asc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("No team members found in Firestore. Seeding default team dataset...");
      await seedTeamDataIfEmpty();
      const newSnapshot = await getDocs(q);
      return newSnapshot.docs.map(docSnap => ({ docId: docSnap.id, ...docSnap.data() }));
    }

    return snapshot.docs.map(docSnap => ({ docId: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching team members from Firestore:", error);
    return INITIAL_TEAM_MEMBERS;
  }
};

// Seed team members if collection is empty
export const seedTeamDataIfEmpty = async () => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    for (const member of INITIAL_TEAM_MEMBERS) {
      await addDoc(colRef, {
        ...member,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Seeding team data failed:", error);
  }
};

// Add a new team member strictly to Firestore
export const addTeamMember = async (memberData) => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(colRef, {
      ...memberData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { docId: docRef.id, ...memberData };
  } catch (error) {
    console.error("Error adding team member to Firestore:", error);
    throw error;
  }
};

// Update an existing team member by docId in Firestore
export const updateTeamMember = async (docId, updatedData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
    return { docId, ...updatedData };
  } catch (error) {
    console.error("Error updating team member in Firestore:", error);
    throw error;
  }
};

// Delete a team member docId in Firestore
export const deleteTeamMember = async (docId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting team member from Firestore:", error);
    throw error;
  }
};

// Upload member avatar image to Firebase Storage
export const uploadMemberAvatar = async (file, memberId) => {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 600,
      useWebWorker: true,
      fileType: 'image/jpeg'
    });

    const storageRef = ref(storage, `team_avatars/${memberId}_${Date.now()}.jpg`);
    await uploadBytes(storageRef, compressedFile);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading avatar image to Firebase Storage:", error);
    throw error;
  }
};
