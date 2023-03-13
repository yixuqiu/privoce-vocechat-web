import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { isMobile } from '../../common/utils';

export default function SignInLink({ token }: { token?: string }) {
  const { t } = useTranslation("auth");
  useEffect(() => {
    // 移动端访问，则跳转
    if (isMobile() && !!token) {
      location.href = `https://join.voce.chat/download?link=${encodeURIComponent(`${location.origin}&magic_token=${token}`)}`;
    }
  }, [token]);

  return (
    <div className="flex gap-1 mt-7 text-sm text-slate-500 dark:text-gray-100 justify-center">
      <span>{t("reg.have_account")}</span>
      <NavLink to={"/login"} className="text-primary-400 cursor-pointer">{t("sign_in")}</NavLink>
    </div>
  );
}
