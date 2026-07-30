/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const hasVerified = useRef(false);
  const { userStore } = useStore();
  

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    const verify = async () => {
      try {
  const data = await userStore.verifyEmail(token);
        toast.success(data.message);

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } catch (error) {
        toast.error(error.message || "Email verification failed");
      }
    };

    verify();
  }, [token, navigate, userStore]);

  return <h2>Verifying Email...</h2>;
}

export default observer(VerifyEmail);