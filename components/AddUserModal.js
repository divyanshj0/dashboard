import { useEffect } from "react";
import clsx from 'clsx';

export default function AddUserModal({ user, onChange, onSubmit, save, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Password policy validation rules
  const passwordLengthValid = user.password.length >= 8 && user.password.length <= 72;
  const hasUppercase = /[A-Z]/.test(user.password);
  const hasNumber = /[0-9]/.test(user.password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(user.password);

  const isPasswordPolicyMet = passwordLengthValid && hasUppercase && hasNumber && hasSpecialChar;

  const isValid = user.firstName.trim() !== '' && user.email.trim() !== '' && user.password.trim() !== '' && user.confirmPassword.trim() !== '' && user.password === user.confirmPassword && isPasswordPolicyMet;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-xl">&times;</button>
        <h2 className="text-xl font-semibold mb-4 text-blue-700">Add User</h2>

        <form className="space-y-4">
          {['firstName', 'lastName', 'email', 'password', 'confirmPassword'].map(field => (
            <input
              key={field}
              type={field === 'email' ? 'email' : 'text'}
              placeholder={field!== 'lastName'?`${field} *`:`${field}`}
              value={user[field]}
              onChange={(e) => onChange(field, e.target.value)}
              required ={field!== 'lastName'}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-400"
            />
          ))}
          {user.confirmPassword && user.password !== user.confirmPassword && (
            <div style={{ color: 'red', fontSize: '0.9em' }}>Password do not match</div>
          )}

          <div className="text-sm space-y-1">
            <h4 className="font-semibold text-gray-700">Password must contain:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li className={clsx({ 'text-green-600': passwordLengthValid, 'text-red-500': !passwordLengthValid })}>
                Between 8 and 72 characters
              </li>
              <li className={clsx({ 'text-green-600': hasUppercase, 'text-red-500': !hasUppercase })}>
                At least one uppercase character
              </li>
              <li className={clsx({ 'text-green-600': hasNumber, 'text-red-500': !hasNumber })}>
                At least one number
              </li>
              <li className={clsx({ 'text-green-600': hasSpecialChar, 'text-red-500': !hasSpecialChar })}>
                At least one special character
              </li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" onClick={onSubmit} className={`px-4 py-2 bg-blue-600 text-white rounded ${save ||!isValid ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={save|| !isValid}>
              {save ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}