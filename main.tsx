import React, { useState, useEffect } from 'react';
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

const FOOTER_WORDS = ["Sasha", "Nikita", "real niggas", "crazy bitches", "Putin"];

export default function App() {
  const [plans, setPlans] = useState<Record<string, string>>(() => {
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
    "Morning": true,
    "Afternoon": true,
    "Evening": true,
    "Night": true
  });

  const [footerWord, setFooterWord] = useState(FOOTER_WORDS[0]);

  const dateKey = getDateKey(selectedDate);
  const isToday = dateKey === getDateKey(currentTime);

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

  const handleEdit = (time: string, currentText: string) => {
    setEditingSlot(time);
    setEditValue(currentText || '');
  };

  const handleSave = (time: string) => {
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
  };

  const handleCancel = () => {
    setEditingSlot(null);
    setEditValue('');
  };

  const handleDelete = (time: string) => {
    const fullKey = `${dateKey}_${time}`;
    const newPlans = { ...plans };
    delete newPlans[fullKey];
    setPlans(newPlans);
  };

  const formatTime = (time: string) => {
    const [hourStr, minute] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const scrollToCurrentTime = () => {
    if (!isToday) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      setSelectedDate(d);
    }
    
    setTimeout(() => {
      const hour = currentTime.getHours().toString().padStart(2, '0');
      const minute = currentTime.getMinutes() >= 30 ? '30' : '00';
      const timeString = `${hour}:${minute}`;
      
      const group = getGroupForTime(timeString);
      if (!expandedGroups[group]) {
        setExpandedGroups(prev => ({ ...prev, [group]: true }));
      }
      
      setTimeout(() => {
        const element = document.getElementById(`slot-${timeString}`);
        if (element) {
          const headerOffset = 100;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 50);
    }, 100);
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    setEditingSlot(null);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    setEditingSlot(null);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const displayDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: selectedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });

  const currentHour = currentTime.getHours().toString().padStart(2, '0');
  const currentMinuteSlot = currentTime.getMinutes() >= 30 ? '30' : '00';
  const currentSlotString = `${currentHour}:${currentMinuteSlot}`;

  const groupedSlots = TIME_SLOTS.reduce((acc, time) => {
    const group = getGroupForTime(time);
    if (!acc[group]) acc[group] = [];
    acc[group].push(time);
    return acc;
  }, {} as Record<string, string[]>);

  // Ensure groups are displayed in the correct order
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
            
            // Check if any slot in this group has a plan
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
                    {slots.map((time) => {
                      const isEditing = editingSlot === time;
                      const fullKey = `${dateKey}_${time}`;
                      const planText = plans[fullKey];
                      const hasPlan = !!planText;
                      const isCurrentSlot = isToday && time === currentSlotString;

                      return (
                        <div
                          key={time}
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
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSave(time);
                                    }
                                    if (e.key === 'Escape') {
                                      handleCancel();
                                    }
                                  }}
                                  placeholder="Type your plan..."
                                  className="w-full bg-zinc-900/80 border border-zinc-700 rounded-md px-3 py-2 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none min-h-[60px] text-sm sm:text-base font-light"
                                />
                                <div className="flex flex-col gap-2 shrink-0">
                                  <button
                                    onClick={() => handleSave(time)}
                                    className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                    title="Save (Enter)"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
                                    title="Cancel (Esc)"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleEdit(time, planText)}
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

                          {!isEditing && hasPlan && (
                            <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                              <button
                                onClick={() => handleDelete(time)}
                                className="p-1 text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer"
                                title="Delete plan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-zinc-900 bg-black/50 py-6 mt-auto">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm font-light">
            For <span className="text-zinc-300 font-medium transition-all duration-300 inline-block min-w-[100px]">{footerWord}</span> with love, truly yours <span className="text-zinc-400 font-mono">@oldpetrus</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
