
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { FunctionResponseScheduling } from '@google/genai';
import { FunctionCall } from '../state';

export const seafarerTools: FunctionCall[] = [
  {
    name: 'upsert_seafarer_profile',
    description: 'Saves or updates the seafarer\'s profile data (name, rank, years of experience, status).',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Full name of the seafarer.' },
        rank: { type: 'STRING', description: 'Current maritime rank (e.g., Able Seaman, Bosun, Third Officer).' },
        yearsOfExperience: { type: 'NUMBER', description: 'Total years of experience at sea.' },
        status: { type: 'STRING', description: 'Current status (e.g., Onboard, Vacation, Applying).' },
        lastVesselType: { type: 'STRING', description: 'Type of the last vessel served on.' }
      },
      required: ['name', 'rank'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'get_seafarer_profile',
    description: 'Retrieves the saved profile information of the current seafarer context.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Name of the seafarer to look up.' },
      },
      required: ['name'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'evaluate_contract_offer',
    description: 'Analyzes a job contract offer to determine if it is favorable or has red flags.',
    parameters: {
      type: 'OBJECT',
      properties: {
        basicSalary: { type: 'NUMBER', description: 'Basic monthly salary in USD.' },
        contractDuration: { type: 'NUMBER', description: 'Duration of contract in months.' },
        overtimeRate: { type: 'NUMBER', description: 'Fixed overtime rate.' },
        vesselType: { type: 'STRING', description: 'Type of vessel.' },
        route: { type: 'STRING', description: 'Trading route (e.g., Worldwide, Inter-island).' }
      },
      required: ['basicSalary', 'contractDuration'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'simulate_take_home_and_allotment',
    description: 'Calculates the estimated take-home pay and family allotment based on salary split.',
    parameters: {
      type: 'OBJECT',
      properties: {
        totalSalary: { type: 'NUMBER', description: 'Total monthly salary in USD.' },
        allotmentPercentage: { type: 'NUMBER', description: 'Percentage of salary to send home (0-100).' },
        deductions: { type: 'NUMBER', description: 'Estimated total deductions.' }
      },
      required: ['totalSalary', 'allotmentPercentage'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'generate_rank_upgrade_plan',
    description: 'Creates a step-by-step career progression plan to reach the next maritime rank.',
    parameters: {
      type: 'OBJECT',
      properties: {
        currentRank: { type: 'STRING', description: 'The seafarer\'s current rank.' },
        targetRank: { type: 'STRING', description: 'The desired target rank.' },
      },
      required: ['currentRank', 'targetRank'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'list_required_trainings_and_certs',
    description: 'Lists the mandatory trainings and certifications required for a specific rank or vessel type.',
    parameters: {
      type: 'OBJECT',
      properties: {
        rank: { type: 'STRING', description: 'The rank to check requirements for.' },
        vesselType: { type: 'STRING', description: 'Optional vessel type (e.g., Tanker, Passenger).' }
      },
      required: ['rank'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'search_open_positions',
    description: 'Searches the backend for available job openings matching the seafarer\'s rank.',
    parameters: {
      type: 'OBJECT',
      properties: {
        rank: { type: 'STRING', description: 'Rank to filter jobs by.' },
        preferredVessel: { type: 'STRING', description: 'Preferred vessel type.' }
      },
      required: ['rank'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'schedule_follow_up_session',
    description: 'Books a follow-up consultation with a human career counselor or advanced AI session.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: { type: 'STRING', description: 'Main topic for the follow-up.' },
        preferredDate: { type: 'STRING', description: 'Preferred date/time string.' }
      },
      required: ['topic'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'save_conversation_journal',
    description: 'Saves a summary or "diary entry" of the current conversation for the seafarer\'s personal record.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seafarerName: { type: 'STRING', description: 'Name of the seafarer.' },
        summary: { type: 'STRING', description: 'Key points discussed in the session.' },
        sentiment: { type: 'STRING', description: 'Overall mood/sentiment of the entry.' }
      },
      required: ['seafarerName', 'summary'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'fetch_support_and_helplines',
    description: 'Retrieves contact information for mental health, legal aid, or union support services.',
    parameters: {
      type: 'OBJECT',
      properties: {
        issueType: { type: 'STRING', description: 'Type of support needed (e.g., Mental Health, Legal, Financial).' },
        location: { type: 'STRING', description: 'Current location of the seafarer (e.g., At Sea, Philippines).' }
      },
      required: ['issueType'],
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'create_family_remittance_plan',
    description: 'Build a simple family remittance and savings plan based on income, fixed expenses, and goals so Kapitan Niyero can explain it in simple terms.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seafarer_id: {
          type: 'STRING',
          description: 'ID of the seafarer (optional if not stored).'
        },
        monthly_income_usd: {
          type: 'NUMBER',
          description: 'Estimated total monthly income (basic + fixed allowances).'
        },
        current_allotment_usd: {
          type: 'NUMBER',
          description: 'Current monthly allotment sent to family.'
        },
        fixed_family_expenses_php: {
          type: 'NUMBER',
          description: 'Total fixed monthly family expenses in PHP (rent, tuition, loans, etc.).'
        },
        savings_goal_php: {
          type: 'NUMBER',
          description: 'Savings goal amount in PHP (e.g., house downpayment, car, business capital).'
        },
        months_to_goal: {
          type: 'INTEGER',
          description: 'Target number of months to reach the savings goal.'
        },
        exchange_rate_usd_to_php: {
          type: 'NUMBER',
          description: 'FX rate to convert USD income to PHP for the plan.'
        }
      },
      required: ['monthly_income_usd', 'fixed_family_expenses_php', 'savings_goal_php', 'months_to_goal']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'check_document_expiry_status',
    description: 'Check which seafarer documents are expired or near expiry so Kapitan Niyero can remind the user to renew.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seafarer_id: {
          type: 'STRING',
          description: 'ID of the seafarer (if available in your DB).'
        },
        documents: {
          type: 'ARRAY',
          description: 'List of documents with expiry dates.',
          items: {
            type: 'OBJECT',
            properties: {
              name: {
                type: 'STRING',
                description: 'Name of the document (e.g., \'Passport\', \'Seaman Book\', \'US Visa\').'
              },
              expiry_date_iso: {
                type: 'STRING',
                description: 'Expiry date in ISO 8601 format (YYYY-MM-DD).'
              }
            },
            required: ['name', 'expiry_date_iso']
          }
        },
        warning_threshold_days: {
          type: 'INTEGER',
          description: 'Number of days before expiry considered as \'expiring soon\'.',
          default: 90
        }
      },
      required: ['documents']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'log_sea_service_record',
    description: 'Log a sea service record entry for the seafarer (for future promotion, COE requirements, and career timeline).',
    parameters: {
      type: 'OBJECT',
      properties: {
        seafarer_id: {
          type: 'STRING',
          description: 'ID of the seafarer.'
        },
        vessel_name: {
          type: 'STRING',
          description: 'Name of the vessel.'
        },
        vessel_type: {
          type: 'STRING',
          description: 'Type of the vessel (e.g., bulk, tanker, container, cruise, OSV).'
        },
        rank: {
          type: 'STRING',
          description: 'Rank served during this contract.'
        },
        company_name: {
          type: 'STRING',
          description: 'Name of the principal/company.'
        },
        agency_name: {
          type: 'STRING',
          description: 'Name of the crewing agency.'
        },
        sign_on_date_iso: {
          type: 'STRING',
          description: 'Sign-on date in ISO 8601 format.'
        },
        sign_off_date_iso: {
          type: 'STRING',
          description: 'Sign-off date in ISO 8601 format.'
        },
        remarks: {
          type: 'STRING',
          description: 'Optional notes about the contract (good/bad experience, incidents, etc.).'
        }
      },
      required: [
        'seafarer_id',
        'vessel_name',
        'vessel_type',
        'rank',
        'sign_on_date_iso',
        'sign_off_date_iso'
      ]
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'get_sea_service_timeline',
    description: 'Return a structured timeline/summary of sea service for use in coaching, promotion planning, or export to COE forms.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seafarer_id: {
          type: 'STRING',
          description: 'ID of the seafarer.'
        },
        group_by: {
          type: 'STRING',
          enum: ['year', 'rank', 'vessel_type'],
          description: 'How to group the timeline summary.'
        },
        include_raw_entries: {
          type: 'BOOLEAN',
          description: 'Whether to return raw sea service entries along with summary.'
        }
      },
      required: ['seafarer_id']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'generate_mock_interview_questions',
    description: 'Generate structured mock interview question sets for a seafarer based on rank, vessel type, and company style.',
    parameters: {
      type: 'OBJECT',
      properties: {
        target_rank: {
          type: 'STRING',
          description: 'Rank the seafarer is interviewing for.'
        },
        vessel_type: {
          type: 'STRING',
          description: 'Type of vessel related to the interview, if known.'
        },
        company_name: {
          type: 'STRING',
          description: 'Company/principal name to adapt difficulty or focus (optional).'
        },
        difficulty_level: {
          type: 'STRING',
          enum: ['basic', 'standard', 'advanced'],
          description: 'Overall difficulty of the interview questions.'
        },
        num_questions: {
          type: 'INTEGER',
          description: 'Desired number of questions to generate.',
          default: 10
        }
      },
      required: ['target_rank']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'evaluate_mock_interview_answer',
    description: 'Score and annotate a single interview answer transcript so Kapitan Niyero can give pointed coaching feedback.',
    parameters: {
      type: 'OBJECT',
      properties: {
        question: {
          type: 'STRING',
          description: 'The interview question asked.'
        },
        answer_transcript: {
          type: 'STRING',
          description: 'Transcribed answer from the seafarer (from live audio).'
        },
        target_rank: {
          type: 'STRING',
          description: 'Rank this interview is for (for scoring expectations).'
        },
        vessel_type: {
          type: 'STRING',
          description: 'Relevant vessel type if applicable.'
        },
        company_profile: {
          type: 'STRING',
          description: 'Short profile or tags of the company (e.g., \'oil major\', \'Japanese owner\', \'European owner\').'
        }
      },
      required: ['question', 'answer_transcript']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'recommend_training_providers',
    description: 'Recommend training centers or course providers that offer the required maritime courses for the seafarer.',
    parameters: {
      type: 'OBJECT',
      properties: {
        required_courses: {
          type: 'ARRAY',
          description: 'List of required or desired maritime courses (e.g., \'BT\', \'ERS\', \'BRM\', \'Tanker Familiarization\').',
          items: {
            type: 'STRING'
          }
        },
        city_or_region: {
          type: 'STRING',
          description: 'Preferred city/region (e.g., \'Manila\', \'Cebu\', \'Davao\', \'Iloilo\').'
        },
        max_budget_php: {
          type: 'NUMBER',
          description: 'Optional max budget for total course fees.'
        },
        prefer_online_or_blended: {
          type: 'BOOLEAN',
          description: 'Whether the seafarer prefers online or blended courses if available.'
        }
      },
      required: ['required_courses', 'city_or_region']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'summarize_session_for_crm',
    description: 'Create a short, structured summary of the live audio session for your CRM or dashboard.',
    parameters: {
      type: 'OBJECT',
      properties: {
        session_id: {
          type: 'STRING',
          description: 'Unique ID of the conversation/session.'
        },
        seafarer_id: {
          type: 'STRING',
          description: 'ID of the seafarer, if known.'
        },
        raw_transcript: {
          type: 'STRING',
          description: 'Transcript of the session to summarize.'
        },
        channel: {
          type: 'STRING',
          description: 'Channel used (e.g., \'live_audio\', \'phone\', \'webchat\').'
        }
      },
      required: ['session_id', 'raw_transcript']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'label_conversation_topics',
    description: 'Auto-label the main topics of the conversation (e.g., contract, mental health, promotion, family, training) for analytics.',
    parameters: {
      type: 'OBJECT',
      properties: {
        raw_transcript: {
          type: 'STRING',
          description: 'Transcript of the conversation.'
        },
        top_n: {
          type: 'INTEGER',
          description: 'Maximum number of topic labels to return.',
          default: 5
        }
      },
      required: ['raw_transcript']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  },
  {
    name: 'escalate_to_human_captain',
    description: 'Trigger an escalation to a human captain/mentor (e.g., Kapitan Panyero or another coach) when the situation needs human handling.',
    parameters: {
      type: 'OBJECT',
      properties: {
        seafarer_id: {
          type: 'STRING',
          description: 'ID of the seafarer needing escalation.'
        },
        reason: {
          type: 'STRING',
          description: 'Short explanation of why this should be escalated (e.g., \'serious mental stress\', \'legal issue with agency\', \'complex contract dispute\').'
        },
        urgency_level: {
          type: 'STRING',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'How urgent the escalation is.'
        },
        preferred_captain: {
          type: 'STRING',
          description: 'Name or tag of the preferred human mentor (e.g., \'panyero\', \'niyero\', \'any\').'
        }
      },
      required: ['seafarer_id', 'reason', 'urgency_level']
    },
    isEnabled: true,
    scheduling: FunctionResponseScheduling.INTERRUPT,
  }
];
