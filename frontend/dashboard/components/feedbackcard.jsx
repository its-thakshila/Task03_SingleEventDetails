import { useState } from 'react';
import { Star, Send } from 'lucide-react';

export default function FeedbackCard() {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = () => {
        if (!feedback.trim() && rating === 0) return;
        setIsSubmitted(true);
    };

    const resetForm = () => {
        setRating(0);
        setFeedback('');
        setIsSubmitted(false);
    };

    if (isSubmitted) {
        return (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-green-600 text-xl">✓</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Thank You!</h3>
                    <p className="text-gray-600 mb-4">Your feedback has been submitted.</p>
                    <button
                        onClick={resetForm}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Feedback</h2>

            <div className="space-y-4">
                {/* Star Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate your experience
                    </label>
                    <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                            >
                                <Star
                                    className={`w-6 h-6 ${
                                        star <= rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                    } hover:text-yellow-400 transition-colors`}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feedback Text */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us what you think..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!feedback.trim() && rating === 0}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-4 h-4" />
                    <span>Submit Feedback</span>
                </button>
            </div>
        </div>
    );
}