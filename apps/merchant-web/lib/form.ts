/** A text field from submitted form data; file inputs and missing fields become ''. */
export function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
