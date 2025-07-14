import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ThumbsUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface SessionRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
  session: {
    title: string;
    coach: string;
    date: string;
  };
}

export function SessionRatingModal({
  isOpen,
  onClose,
  onSubmit,
  session,
}: SessionRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSubmit(rating, feedback);

      // Reset form
      setRating(0);
      setHoveredRating(0);
      setFeedback("");
    } catch (error) {
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setFeedback("");
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Rate this session";
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1:
      case 2:
        return "text-red-600";
      case 3:
        return "text-yellow-600";
      case 4:
      case 5:
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Rate Your Session
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold">{session.title}</h4>
            <p className="text-sm text-gray-600">with {session.coach}</p>
            <p className="text-sm text-gray-500">
              {new Date(session.date).toLocaleDateString()}
            </p>
          </div>

          {/* Rating Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              How would you rate this session?
            </Label>

            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-center">
              <span
                className={`text-lg font-medium ${getRatingColor(
                  hoveredRating || rating,
                )}`}
              >
                {getRatingText(hoveredRating || rating)}
              </span>
            </div>
          </div>

          {/* Quick Feedback Options */}
          {rating > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">
                What did you like most?
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Clear explanations",
                  "Practical examples",
                  "Interactive discussion",
                  "Relevant content",
                  "Coach expertise",
                  "Session structure",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      const newFeedback = feedback.includes(option)
                        ? feedback
                            .replace(option, "")
                            .replace(", ,", ",")
                            .trim()
                        : feedback
                          ? `${feedback}, ${option}`
                          : option;
                      setFeedback(newFeedback);
                    }}
                    className={`text-sm p-2 rounded-lg border transition-colors ${
                      feedback.includes(option)
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional Feedback */}
          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-base font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Share any additional thoughts about this session..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Rating
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
