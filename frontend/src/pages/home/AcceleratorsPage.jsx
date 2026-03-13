import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AcceleratorsPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/list/accelerator', { replace: true }); }, [navigate]);
  return null;
}
