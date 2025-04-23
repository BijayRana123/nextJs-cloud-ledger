import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/lib/models';
import { NextResponse } from 'next/server';

export const protect = async (req) => {
  await dbConnect();

  let token;

  // Check for token in Authorization header (standard JWT practice)
  if (req.headers.get('authorization') && req.headers.get('authorization').startsWith('Bearer')) {
    token = req.headers.get('authorization').split(' ')[1];
  }
  // If not found in Authorization header, check for token in cookies
  // Checking for the Supabase auth token cookie
  if (!token && req.cookies.has('sb-mnvxxmmrlvjgpnhditxc-auth-token')) {
      const cookieValue = req.cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token').value;
      try {
          // Attempt to parse the cookie value as a JSON array and get the first element
          const cookieArray = JSON.parse(cookieValue);
          if (Array.isArray(cookieArray) && cookieArray.length > 0 && typeof cookieArray[0] === 'string') {
              token = cookieArray[0]; // The actual JWT is the first element
          } else {
              console.error('Auth middleware: Unexpected cookie value format');
          }
      } catch (parseError) {
          console.error('Auth middleware: Failed to parse cookie value:', parseError);
      }
  }


  if (!token) {
    return NextResponse.json({ message: 'Not authorized to access this route (no valid token found)' }, { status: 401 });
  }

  try {
    // Use the extracted token for verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware: Decoded JWT payload:', decoded); // Log decoded payload

    // Attach user and organization to the request object (for use in route handlers)
    // Note: In Next.js 13/14 App Router, modifying the request object directly in middleware
    // and accessing it in route handlers requires a different approach (e.g., using context
    // or passing data via headers/cookies). For simplicity here, I'll just verify and
    // return the user/org IDs, and the route handler can fetch the full user if needed.
    const user = await User.findById(decoded.user.id).populate({ // Use a temporary variable 'user'
      path: 'roles',
      populate: {
        path: 'permissions',
      },
    });
    console.log('Auth middleware: User found:', user ? user._id : 'None'); // Log if user was found

    req.user = user; // Assign the found user to req.user
    req.organizationId = decoded.user.organizationId;


    if (!req.user) {
         return NextResponse.json({ message: 'User not found based on token ID' }, { status: 401 }); // More specific message
    }

    return null; // No error, proceed

  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ message: 'Not authorized to access this route' }, { status: 401 });
  }
};

export const authorize = (...requiredPermissions) => {
  return (req) => {
    if (!req.user) {
      // This case should ideally not happen if protect middleware is used before authorize
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const userPermissions = req.user.roles.reduce((acc, role) => {
      role.permissions.forEach(permission => {
        if (!acc.includes(permission.name)) {
          acc.push(permission.name);
        }
      });
      return acc;
    }, []);

    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return NextResponse.json({ message: 'User not authorized to perform this action' }, { status: 403 });
    }

    return null; // No error, proceed
  };
};
