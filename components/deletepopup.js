export default function DeletePopup({onConfirm, onCancel,deleting}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg p-6 shadow-xl text-center">
        <div className="mb-4 text-lg">{` Are you sure you want to delete ?`}</div>
        <div className="flex justify-center space-x-4 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">{deleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}
