import Authenticator from "@/components/auth/Authenticator";


export default function ProtectedLayout({
children
}) {


return (

<Authenticator>

{children}

</Authenticator>

);


}