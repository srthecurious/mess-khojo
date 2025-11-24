è9'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useUser } from '@/firebase';
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
} from '@/firebase/non-blocking-login';
import { Logo } from '@/components/ui/logo';
import { useRouter } from 'next/navigation';
import '../login.css';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);


  const loginForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = (values: FormValues) => {
    setIsLoading(true);
    initiateEmailSignIn(auth, values.email, values.password).finally(() => {
      setIsLoading(false);
    });
    // The AuthProvider will handle the redirect on successful login.
  };

  const handleSignUp = (values: FormValues) => {
    setIsLoading(true);
    initiateEmailSignUp(auth, values.email, values.password).finally(() => {
      setIsLoading(false);
    });
    // The AuthProvider will handle the redirect on successful sign-up.
  };

  if (isUserLoading || user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
        <div className="loader">
          <div className="truckWrapper">
            <div className="truckBody">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 130 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M104.24,59.37H14.78a4,4,0,0,1-4-4V16.89a4,4,0,0,1,4-4H91.56a13.7,13.7,0,0,1,12.68,8.22L116,47.45V55.37a4,4,0,0,1-4,4ZM18.78,51.37H99.19v-26H18.78Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M91.56,12.89h-76.78a4,4,0,0,0-4,4V29.11H99.19V21.11A8.22,8.22,0,0,0,91.56,12.89Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <div className="truckTires">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
                <circle cx="12" cy="12" r="4" fill="var(--background)"></circle>
              </svg>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="currentColor"></circle>
                <circle cx="12" cy="12" r="4" fill="var(--background)"></circle>
              </svg>
            </div>
            <div className="road"></div>
            <svg
              className="lampPost"
              width="40"
              height="90"
              viewBox="0 0 40 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 90V10H35V0L25 10H5" stroke="currentColor" strokeWidth="3" />
            </svg>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="mb-16">
        <Logo className="h-20 w-auto" />
      </div>
      <div className="wrapper">
        <div className="card-switch">
          <label className="switch">
            <input
              type="checkbox"
              className="toggle"
              checked={isFlipped}
              onChange={() => setIsFlipped(!isFlipped)}
            />
            <span className="slider"></span>
            <span className="card-side"></span>
          </label>
        </div>
        <div className={`flip-card__inner ${isFlipped ? 'is-flipped' : ''}`}>
          <div className="flip-card__front">
            <div className="title">Log in</div>
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="flip-card__form"
              noValidate
            >
              <input
                {...loginForm.register('email')}
                className="flip-card__input"
                placeholder="Email"
                type="email"
                disabled={isLoading}
              />
              {loginForm.formState.errors.email && <p className="text-red-500 text-xs">{loginForm.formState.errors.email.message}</p>}
              <input
                {...loginForm.register('password')}
                className="flip-card__input"
                placeholder="Password"
                type="password"
                disabled={isLoading}
              />
              {loginForm.formState.errors.password && <p className="text-red-500 text-xs">{loginForm.formState.errors.password.message}</p>}
              <button className="flip-card__btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </div>
          <div className="flip-card__back">
            <div className="title">Sign up</div>
            <form
              onSubmit={signupForm.handleSubmit(handleSignUp)}
              className="flip-card__form"
              noValidate
            >
              <input
                {...signupForm.register('email')}
                className="flip-card__input"
                placeholder="Email"
                type="email"
                disabled={isLoading}
              />
              {signupForm.formState.errors.email && <p className="text-red-500 text-xs">{signupForm.formState.errors.email.message}</p>}
              <input
                {...signupForm.register('password')}
                className="flip-card__input"
                placeholder="Password"
                type="password"
                disabled={isLoading}
              />
              {signupForm.formState.errors.password && <p className="text-red-500 text-xs">{signupForm.formState.errors.password.message}</p>}
              <button className="flip-card__btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing up...' : 'Sign up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
è9*cascade08"(5d61d427a222e017a17c122ac4c4c05a08fc512028file:///c:/Apps/NEETrack/NEETrack/src/app/login/page.tsx:!file:///c:/Apps/NEETrack/NEETrack