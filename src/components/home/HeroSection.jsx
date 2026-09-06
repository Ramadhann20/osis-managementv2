export default function HeroSection(){

return (

<header
className="
relative
pt-32 pb-20
md:pt-48 md:pb-40
overflow-hidden
"
>


<div
className="
absolute
top-0 right-0
w-[500px]
h-[500px]
rounded-full
bg-primary
opacity-20
blur-[80px]
"
/>


<div
className="
absolute
bottom-0 left-0
w-[400px]
h-[400px]
rounded-full
bg-teal-200
opacity-30
blur-[80px]
"
/>



<div
className="
max-w-7xl
mx-auto
px-6
text-center
"
>


<h1
className="
text-4xl
md:text-6xl
font-bold
leading-tight
text-text
"
>

Empowering Student Leadership at

<span className="text-primary">
 SMA Mutiara 2 Bandung
</span>

</h1>



<p
className="
mt-6
max-w-xl
mx-auto
text-lg
text-text-muted
"
>

Digitalizing student government management
for transparency, collaboration, and efficient
workflow in every school event.

</p>



<div
className="
mt-10
flex
flex-col
sm:flex-row
justify-center
gap-4
"
>


<a
href="/login"
className="
px-8 py-4
rounded-xl
bg-primary
text-white
font-semibold
shadow-xl
flex items-center justify-center gap-2
"
>

Login

</a>



<a
href="/register"
className="
px-8 py-4
rounded-xl
border-2
border-primary
text-primary
"
>

Registrasi Akun

</a>


</div>


</div>


</header>

);

}