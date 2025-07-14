import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Monitor,
  X,
  Check,
} from "lucide-react";
import {
  Session,
  SessionType,
  SessionScheduleRequest,
} from "../../types/session";
import { Mentor } from "../../types/mentor";
import { toast } from "react-hot-toast";

interface SessionSchedulerProps {
  mentor: Mentor;
  mentorshipRequestId: string;
  existingSessions?: Session[];
  onSchedule: (request: SessionScheduleRequest) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked?: boolean;
}

const sessionTypeIcons = {
  video: Video,
  audio: Phone,
  chat: MessageSquare,
  screen_share: Monitor,
};

const sessionTypeLabels = {
  video: "Video Call",
  audio: "Audio Call",
  chat: "Chat Only",
  screen_share: "Screen Share",
};

export const SessionScheduler: React.FC<SessionSchedulerProps> = ({
  mentor,
  mentorshipRequestId,
  existingSessions = [],
  onSchedule,
  onClose,
  isOpen,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<SessionType>("video");
  const [duration, setDuration] = useState<number>(60); // minutes
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableSlots();
    }
  }, [selectedDate, mentor.availability, existingSessions]);

  const generateAvailableSlots = () => {
    const dayOfWeek = selectedDate.getDay();
    const mentorAvailability = mentor.availability.filter(
      (avail) => avail.dayOfWeek === dayOfWeek,
    );

    if (mentorAvailability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];

    mentorAvailability.forEach((avail) => {
      const startHour = parseInt(avail.startTime.split(":")[0]);
      const endHour = parseInt(avail.endTime.split(":")[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hour, 0, 0, 0);

        // Check if slot is in the past
        const now = new Date();
        const isInPast = slotDateTime <= now;

        // Check if slot is booked
        const isBooked = existingSessions.some((session) => {
          const sessionStart = new Date(session.scheduledStartTime);
          return sessionStart.getTime() === slotDateTime.getTime();
        });

        slots.push({
          time: timeSlot,
          available: !isInPast && !isBooked,
          booked: isBooked,
        });
      }
    });

    setAvailableSlots(slots);
  };

  const handleSchedule = async () => {
    if (!selectedTime || !title.trim()) {
      toast.error("Please select a time and add a title");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const scheduleRequest: SessionScheduleRequest = {
      mentorshipRequestId,
      mentorId: mentor.id,
      title,
      description,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      type: sessionType,
      participants: [mentor.userId], // Add mentees from mentorship request
    };

    try {
      setIsLoading(true);
      await onSchedule(scheduleRequest);
      toast.success("Session scheduled successfully!");
      onClose();
    } catch (error) {
      console.error("Error scheduling session:", error);
      toast.error("Failed to schedule session");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getNextWeekDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <img
              src={
                mentor.profilePicture ||
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
              }
              alt={mentor.getFullName()}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Schedule Session with {mentor.getFullName()}
              </h2>
              <p className="text-sm text-gray-600">{mentor.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Calendar & Time Selection */}
            <div>
              {/* Date Selection */}
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 mr-2" />
                  Select Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {getNextWeekDays().map((date) => {
                    const isSelected =
                      selectedDate.toDateString() === date.toDateString();
                    const dayAvailability = mentor.availability.filter(
                      (avail) => avail.dayOfWeek === date.getDay(),
                    );
                    const hasAvailability = dayAvailability.length > 0;

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        disabled={!hasAvailability}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : hasAvailability
                              ? "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                              : "border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <div className="font-medium">
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="text-xs">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <Clock className="w-4 h-4 mr-2" />
                  Available Times - {formatDate(selectedDate)}
                </label>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No available times for this date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-2 text-sm rounded-lg border transition-colors ${
                          selectedTime === slot.time
                            ? "bg-blue-600 text-white border-blue-600"
                            : slot.available
                              ? "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                              : slot.booked
                                ? "border-red-200 text-red-400 cursor-not-allowed bg-red-50"
                                : "border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {slot.time}
                        {slot.booked && <div className="text-xs">Booked</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Session Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Session Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(sessionTypeIcons).map(([type, Icon]) => (
                    <button
                      key={type}
                      onClick={() => setSessionType(type as SessionType)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                        sessionType === type
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {sessionTypeLabels[type as SessionType]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Right Column - Session Details */}
            <div>
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., React Best Practices Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What would you like to discuss in this session?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Session Summary */}
              {selectedTime && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Session Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">
                        {sessionTypeLabels[sessionType]}
                      </span>
                    </div>
                    {mentor.hourlyRate && (
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span>Cost:</span>
                        <span className="font-medium">
                          ${Math.round((mentor.hourlyRate * duration) / 60)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mentor Availability Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">
                  Mentor Availability
                </h4>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">
                    Response time: ~{mentor.metrics.responseTime} hours
                  </p>
                  <div className="space-y-1">
                    {mentor.availability.map((avail, index) => (
                      <div key={index}>
                        {
                          ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                            avail.dayOfWeek
                          ]
                        }
                        : {avail.startTime} - {avail.endTime}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={!selectedTime || !title.trim() || isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Schedule Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
