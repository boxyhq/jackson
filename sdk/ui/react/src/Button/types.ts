/**
 * This is the description of the Button component's props
 */
export interface ButtonProps {
  /**
   * the type of button
   * @defaultValue 'default'
   */
  type?: 'primary' | 'default' | 'text';
  /**
   * the size of button
   * @defaultValue 'middle'
   */
  size?: 'large' | 'middle' | 'small';
  /**
   * loading state of button
   * @defaultValue false
   */
  loading?: boolean;
  /**
   * click handler
   */
  onClick?: (event: React.MouseEvent) => void;
  /**
   * button content
   */
  children: React.ReactNode;
}
