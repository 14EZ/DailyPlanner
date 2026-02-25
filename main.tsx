import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Clock, Plus, Trash2, Check, X, Target, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const TIME_GROUPS = {
  "Morning": { start: "06:00", end: "11:30" },
  "Afternoon": { start: "12:00", end: "15:30" },
  "Evening": { start: "16:00", end: "21:30" },
  "Night": { start: "22:00", end: "05:30" }
};

const getGroupForTime = (time: string) => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 16) return "Afternoon";
  if (hour >= 16 && hour < 22) return "Evening";
  return "Night";
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FOOTER_WORDS = ["real niggas", "crazy bitches", "Putin", "Most Nikitiev", "Alexandra", "pretty boyz", "6/10"];

const formatTime = (time: string) => {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute} ${ampm}`;
};

interface TimeSlotProps {
  time: string;
  dateKey: string;
  planText: string;
  isCurrentSlot: boolean;
  isEditing: boolean;
  onEdit: (time: string, currentText: string) => void;
  onSave: (time: string) => void;
  onCancel: () => void;
  onDelete: (time: string) => void;
  editValue: string;
  setEditValue: (value: string) => void;
}

const MemoizedTimeSlot = memo(function TimeSlot({
  time, dateKey, planText, isCurrentSlot, isEditing, onEdit, onSave, onCancel, onDelete, editValue, setEditValue
}: TimeSlotProps) {
  const hasPlan = !!planText;

  return (
    <div
      id={`slot-${time}`}
      className={`group flex items-start py-5 sm:py-6 border-b border-zinc-900/50 last:border-b-0 transition-colors relative px-4 ${
        isCurrentSlot ? 'bg-zinc-900/40' : ''
      }`}
    >
      {isCurrentSlot && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-400" />
      )}
      
      <div className={`w-24 sm:w-28 shrink-0 pt-0.5 flex items-center gap-2 font-mono text-sm sm:text-base ${isCurrentSlot ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`}>
        {formatTime(time)}
      </div>

      <div className="flex-1 min-w-0 pl-2 sm:pl-4">
        {isEditing ? (
          <div className="flex items-start gap-3">
            <textarea
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => onSave(time)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              placeholder="Type your plan..."
              className="w-full bg-zinc-900/80 border border-zinc-700 rounded-md px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none min-h-[60px] text-sm sm:text-base font-light"
            />
          </div>
        ) : (
          <div
            onClick={() => onEdit(time, planText)}
            className="min-h-[1.5rem] cursor-text group/edit"
          >
            {hasPlan ? (
              <div className="whitespace-pre-wrap text-sm sm:text-base font-light text-zinc-300 leading-relaxed">{planText}</div>
            ) : (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-mono text-zinc-700 pt-1">
                <Plus className="w-3 h-3" /> ADD PLAN
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default function App() {
  const [plans, setPlans] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('daily-planner-plans');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, string> = {};
        const todayKey = getDateKey(new Date());
        for (const [key, value] of Object.entries(parsed)) {
          if (!key.includes('_')) {
            migrated[`${todayKey}_${key}`] = value as string;
          } else {
            migrated[key] = value as string;
          }
        }
        return migrated;
      }
    } catch (e) {
      console.error('Failed to load plans from localStorage', e);
    }
    return {};
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Morning": false,
    "Afternoon": false,
    "Evening": false,
    "Night": false
  });

  const [footerWord, setFooterWord] = useState(FOOTER_WORDS[0]);

  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);
  const isToday = useMemo(() => dateKey === getDateKey(new Date()), [dateKey]);

  useEffect(() => {
    localStorage.setItem('daily-planner-plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const wordTimer = setInterval(() => {
      setFooterWord((current) => {
        const availableWords = FOOTER_WORDS.filter(w => w !== current);
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        return availableWords[randomIndex];
      });
    }, 4000);
    return () => clearInterval(wordTimer);
  }, []);

  const handleEdit = useCallback((time: string, currentText: string) => {
    setEditingSlot(time);
    setEditValue(currentText || '');
  }, []);

  const handleSave = useCallback((time: string) => {
    const fullKey = `${dateKey}_${time}`;
    if (editValue.trim() === '') {
      const newPlans = { ...plans };
      delete newPlans[fullKey];
      setPlans(newPlans);
    } else {
      setPlans({ ...plans, [fullKey]: editValue });
    }
    setEditingSlot(null);
    setEditValue('');
  }, [dateKey, editValue, plans]);

  const handleCancel = useCallback(() => {
    setEditingSlot(null);
    setEditValue('');
  }, []);

  const handleDelete = useCallback((time: string) => {
    const fullKey = `${dateKey}_${time}`;
    const newPlans = { ...plans };
    delete newPlans[fullKey];
    setPlans(newPlans);
  }, [dateKey, plans]);

  const scrollToCurrentTime = useCallback(() => {
    if (!isToday) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setSelectedDate(d);
    }
    
    setTimeout(() => {
      const now = new Date();
      const hour = now.getHours().toString().padStart(2, '0');
      const minute = now.getMinutes() >= 30 ? '30' : '00';
      const timeString = `${hour}:${minute}`;
      
      const group = getGroupForTime(timeString);
      setExpandedGroups(prev => ({ ...prev, [group]: true }));
      
      setTimeout(() => {
        const element = document.getElementById(`slot-${timeString}`);
        const header = document.querySelector('header');
        if (element && header) {
          const headerHeight = header.offsetHeight;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20; // Added 20px extra padding
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }, 100);
  }, [isToday]);

  const handlePrevDay = useCallback(() => {
    setSelectedDate(d => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
    setEditingSlot(null);
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate(d => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
    setEditingSlot(null);
  }, []);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  }, []);

  const displayDate = useMemo(() => selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  }), [selectedDate]);

  const currentSlotString = useMemo(() => {
    const hour = currentTime.getHours().toString().padStart(2, '0');
    const minute = currentTime.getMinutes() >= 30 ? '30' : '00';
    return `${hour}:${minute}`;
  }, [currentTime]);

  const groupedSlots = useMemo(() => TIME_SLOTS.reduce((acc, time) => {
    const group = getGroupForTime(time);
    if (!acc[group]) acc[group] = [];
    acc[group].push(time);
    return acc;
  }, {} as Record<string, string[]>), []);

  const orderedGroups = ["Morning", "Afternoon", "Evening", "Night"];

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans flex flex-col selection:bg-zinc-800">
      <header className="bg-black/80 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              FuckingPlanner <span className="text-lg sm:text-xl font-medium text-zinc-500">by oldpetrus</span>
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 bg-zinc-900/50 rounded-md border border-zinc-800 p-0.5">
                <button onClick={handlePrevDay} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-zinc-400 text-xs uppercase tracking-widest font-mono px-2 min-w-[120px] text-center">
                  {displayDate}
                </span>
                <button onClick={handleNextDay} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={scrollToCurrentTime}
            className={`flex items-center gap-2 px-5 py-2 bg-transparent border rounded-full text-sm font-mono transition-all self-start sm:self-auto cursor-pointer ${
              isToday 
                ? 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200' 
                : 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <Target className="w-4 h-4" />
            {isToday ? 'NOW' : 'TODAY'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="space-y-6">
          {orderedGroups.map((groupName) => {
            const slots = groupedSlots[groupName];
            const isExpanded = expandedGroups[groupName];
            const timeRange = TIME_GROUPS[groupName as keyof typeof TIME_GROUPS];
            
            const hasPlansInGroup = slots.some(time => !!plans[`${dateKey}_${time}`]);

            return (
              <div key={groupName} className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/50">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-medium text-zinc-200">{groupName}</h2>
                    <span className="text-xs font-mono text-zinc-500">
                      {formatTime(timeRange.start)} - {formatTime(timeRange.end)}
                    </span>
                    {hasPlansInGroup && !isExpanded && (
                      <div className="w-2 h-2 rounded-full bg-zinc-400 ml-2" />
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-900">
                    {slots.map((time) => (
                      <MemoizedTimeSlot
                        key={time}
                        time={time}
                        dateKey={dateKey}
                        planText={plans[`${dateKey}_${time}`]}
                        isCurrentSlot={isToday && time === currentSlotString}
                        isEditing={editingSlot === time}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        onDelete={handleDelete}
                        editValue={editingSlot === time ? editValue : ''}
                        setEditValue={setEditValue}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-black/50 py-6 mt-auto">
        <div className="max-w-3xl mx-auto px-4 text-center flex flex-col items-center gap-1">
          <p className="text-zinc-500 text-sm font-light">
            For <span className="text-zinc-300 font-medium transition-all duration-300 inline-block min-w-[100px]">{footerWord}</span> with fucking care
          </p>
          <p className="text-zinc-400 font-mono text-sm">@lampactstudios</p>
        </div>
      </footer>
    </div>
  );
}
