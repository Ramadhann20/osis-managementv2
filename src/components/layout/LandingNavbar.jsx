"use client";


import Image from "next/image";

import Link from "next/link";

import AppIcon from "@/components/global/AppIcon";



export default function LandingNavbar(){


return (

<nav
className="
fixed
top-0
left-0
w-full
h-20
bg-white/80
backdrop-blur-md
z-50
shadow-sm
"
>


<div
className="
max-w-7xl
mx-auto
h-full
px-6
flex
items-center
justify-between
"
>


<div
className="
flex
items-center
gap-3
"
>


<Image

src="/images/logo-osis-mutiara.jpeg"

alt="Logo OSIS Mutiara 2"

width={40}

height={40}

className="
w-10
h-10
object-contain
rounded-lg
"

/>



<div
className="
flex
flex-col
"
>


<span
className="
font-bold
text-xl
text-text
leading-tight
"
>

SIM OSIS

</span>


<span
className="
text-sm
text-primary
"
>

SMA Mutiara 2 Bandung

</span>


</div>


</div>




<div
className="
hidden
md:flex
items-center
gap-8
"
>


<a
href="#registrasi"
className="
text-sm
text-text-muted
hover:text-primary
"
>

Cara Registrasi

</a>



<Link

href="/login"

className="
px-6
py-2.5
rounded-xl
bg-primary
text-white
shadow-md
"

>

Login

</Link>


</div>



<button
className="
md:hidden
"
>

<AppIcon

name="menu"

size={26}

/>


</button>



</div>


</nav>


);


}