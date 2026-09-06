import LandingNavbar 
from "@/components/layout/LandingNavbar";

import HeroSection 
from "@/components/home/HeroSection";

import RegistrationGuide 
from "@/components/home/RegistrationGuide";

import LandingFooter 
from "@/components/layout/LandingFooter";



export default function Home(){

return (

<>

<LandingNavbar/>


<main>

<HeroSection/>

<RegistrationGuide/>

</main>


<LandingFooter/>


</>

);

}