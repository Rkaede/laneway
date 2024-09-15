import { useNavigate, useParams } from '@solidjs/router';

export function useActionContext() {
  const navigate = useNavigate();
  const params = useParams();

  return { navigate, params };
}
