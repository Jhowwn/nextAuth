import { ReactNode } from "react";
import { useCan } from "../hooks/useCan";

interface CanPprops { 
    children: ReactNode;
    permissions?: string[];
    roles?: string[];
}

export function Can({children, permissions, roles }:CanPprops){
    const userCanSeeComponent = useCan({
        permissions, roles
    });

    if (!userCanSeeComponent){
        return null;
    }
    
    return (
        <>
            {children}
        </>
    )
}