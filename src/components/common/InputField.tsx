import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  validation?: (value: string) => string | null; // Function to validate input
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChangeText, placeholder, validation }) => {
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    if (validation) {
      const validationError = validation(value);
      setError(validationError);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          if (error) setError(null); // Clear error on input change
        }}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        onBlur={handleBlur} // Validate on blur
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
});

export default InputField;