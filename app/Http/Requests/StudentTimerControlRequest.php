<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StudentTimerControlRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled in the controller via policies
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'seconds' => ['nullable', 'integer', 'min:-18000', 'max:18000'], // Optional, but if provided must be valid
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'student_id.required' => 'Please select a student.',
            'student_id.integer' => 'Invalid student ID format.',
            'student_id.exists' => 'The selected student does not exist.',
            'seconds.integer' => 'Seconds must be a whole number.',
            'seconds.min' => 'Adjustment cannot be less than -5 hours.',
            'seconds.max' => 'Adjustment cannot be more than +5 hours.',
        ];
    }
}
