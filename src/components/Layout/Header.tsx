import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface HeaderProps {
  showSearchBar?: boolean;
}

export function Header({ showSearchBar = true }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getInitials = () => {
    const firstName = user?.user_metadata?.first_name || '';
    const first = firstName.charAt(0).toUpperCase();
    return `${first}`
  };

  
  return (
    <header className="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
      {showSearchBar ? (
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search for jobs, companies..."
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer opacity-50 hover:opacity-100" />
        </div>
      ) : (
        <div className="flex-1"></div>
      )}
      
      <div className="flex items-center space-x-4">
        <Link to="/profile" className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-2xl bg-appPurple text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="p-2 rounded-full hover:bg-accent"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
              <AlertDialogDescription>
                You will need to login again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
