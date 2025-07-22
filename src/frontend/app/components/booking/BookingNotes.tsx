'use client';

interface BookingNotesProps {
  notes: string;
}

export default function BookingNotes({ notes }: BookingNotesProps) {
  if (!notes) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Notizen</h2>
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <p className="text-blue-900">{notes}</p>
      </div>
    </div>
  );
}