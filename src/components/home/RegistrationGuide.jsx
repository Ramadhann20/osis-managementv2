export default function RegistrationGuide(){

const steps=[
{
title:"Pilih menu registrasi akun",
desc:"Buka portal dan pilih opsi pendaftaran akun pengurus baru."
},
{
title:"Isi lengkap formulir biodata",
desc:"Masukkan NIS, nama lengkap, kelas, divisi, dan email sekolah."
},
{
title:"Submit biodata pendaftaran",
desc:"Data akan diverifikasi oleh sistem dan pembina OSIS."
}
];


return (

<section
id="registrasi"
className="
py-20
bg-slate-50
"
>


<div
className="
max-w-5xl
mx-auto
px-6
"
>


<div className="text-center mb-16">

<span
className="
text-primary
font-bold
text-sm
"
>
PANDUAN PENDAFTARAN
</span>


<h2
className="
mt-3
text-3xl
font-bold
text-text
"
>
Tata Cara Registrasi Akun Pengurus OSIS
</h2>


<p
className="
mt-4
text-text-muted
"
>
Ikuti 3 langkah mudah berikut.
</p>


</div>



<div
className="
bg-white
rounded-3xl
border
p-8
shadow-sm
"
>


<div className="space-y-6">


{
steps.map((item,index)=>(

<div
key={index}
className="
flex gap-4
pb-6
border-b
last:border-none
"
>


<div
className="
w-8 h-8
rounded-full
bg-primary/10
text-primary
flex
items-center
justify-center
font-bold
"
>
{index+1}
</div>



<div>

<h3
className="
font-semibold
text-text
"
>
{item.title}
</h3>


<p
className="
text-text-muted
mt-1
"
>
{item.desc}
</p>

</div>


</div>


))
}


</div>


</div>


</div>


</section>

);

}