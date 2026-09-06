"use client";


import { 
  useEffect 
} from "react";


import {
  usePathname,
  useRouter
} from "next/navigation";


import {
  useAuth
} from "@/context/AuthContext";



const PUBLIC_ROUTES = [
  "/login",
  "/register"
];



const ROLE_HOME = {

  anggota:
  "/anggota/dashboard",

  pembina:
  "/pembina/dashboard"

};



function matchRoute(pathname, route){

  return (
    pathname === route ||
    pathname.startsWith(`${route}/`)
  );

}



export default function Authenticator({
  children
}){


const router = useRouter();

const pathname = usePathname();


const {

user,

role,

accessLoading

}=useAuth();



const currentPath =
pathname || "/";



const normalizedRole =
String(role || "")
.trim()
.toLowerCase();



const isRootRoute =
currentPath === "/";



const isPublicRoute =
PUBLIC_ROUTES.some(
(route)=>
matchRoute(
currentPath,
route
)
);



const isAnggotaRoute =
matchRoute(
currentPath,
"/anggota"
);



const isPembinaRoute =
matchRoute(
currentPath,
"/pembina"
);



const isPendaftaranRoute =
matchRoute(
currentPath,
"/pendaftaran"
);



const hasRole =
normalizedRole === "anggota" ||
normalizedRole === "pembina";



let redirectTo = null;



if(!accessLoading){



/*
|--------------------------------------------------------------------------
| BELUM LOGIN
|--------------------------------------------------------------------------
*/


if(!user){


/*
Landing boleh
Login/Register boleh
*/


if(
!isRootRoute &&
!isPublicRoute
){

redirectTo="/";

}


}



/*
|--------------------------------------------------------------------------
| SUDAH LOGIN TAPI ROLE BELUM ADA
|--------------------------------------------------------------------------
*/


if(
user &&
!hasRole
){


if(
!isPendaftaranRoute
){

redirectTo="/pendaftaran";

}


}



/*
|--------------------------------------------------------------------------
| LOGIN SEBAGAI ANGGOTA
|--------------------------------------------------------------------------
*/


if(
user &&
normalizedRole==="anggota"
){


if(
isRootRoute ||
isPublicRoute ||
isPembinaRoute
){

redirectTo=
ROLE_HOME.anggota;

}


}



/*
|--------------------------------------------------------------------------
| LOGIN SEBAGAI PEMBINA
|--------------------------------------------------------------------------
*/


if(
user &&
normalizedRole==="pembina"
){


if(
isRootRoute ||
isPublicRoute ||
isAnggotaRoute
){

redirectTo=
ROLE_HOME.pembina;

}


}



}



useEffect(()=>{


if(
redirectTo &&
redirectTo !== currentPath
){

router.replace(
redirectTo
);

}


},[
redirectTo,
currentPath,
router
]);





if(
accessLoading ||
redirectTo
){

return (

<main
className="
min-h-screen
flex
items-center
justify-center
bg-surface
"
>

<div
className="
rounded-xl
border
border-border
bg-card
px-6
py-4
shadow-sm
text-text-muted
"
>

Memeriksa akses...

</div>


</main>

)

}



return children;


}