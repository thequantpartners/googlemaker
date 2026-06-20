import React from 'react';
import Link from 'next/link';

export type StepStatus = 'completed' | 'current' | 'pending';

interface StepItemProps {
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  actionText?: string;
  actionHref?: string;
}

export default function StepItem({
  number,
  title,
  description,
  status,
  actionText,
  actionHref,
}: StepItemProps) {
  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';

  return (
    <div
      className={`group flex items-center justify-between p-4 mb-3 rounded-2xl transition-all duration-300 ease-out border border-transparent ${
        isCurrent ? 'bg-white shadow-sm ring-1 ring-gray-100 hover:shadow-md' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-6">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors duration-300 ${
            isCompleted
              ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
              : isCurrent
              ? 'bg-gray-100 text-gray-900 border-2 border-gray-200'
              : 'bg-gray-50 text-gray-400 border border-gray-200'
          }`}
        >
          {isCompleted ? (
            <svg
              className="w-5 h-5 animate-[bounce-in_0.5s_ease-out]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            number
          )}
        </div>
        
        <div>
          <h3
            className={`text-base font-medium transition-colors ${
              isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="ml-4 flex-shrink-0">
        {isCompleted ? (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
             <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : !isCompleted && actionText && actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 bg-[#9F83F0] rounded-lg hover:bg-[#8B6CE0] hover:shadow-[0_4px_14px_rgba(159,131,240,0.39)] focus:outline-none focus:ring-2 focus:ring-[#9F83F0] focus:ring-offset-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {actionText}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
