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
  // First try the direct token cookie (new format)
  if (!token && req.cookies.has('sb-mnvxxmmrlvjgpnhditxc-auth-token')) {
      const cookieValue = req.cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token').value;
      
      // Check if the cookie value is a valid JWT (should have 3 parts separated by dots)
      if (typeof cookieValue === 'string' && cookieValue.split('.').length === 3) {
          token = cookieValue;
      } else {
          try {
              // Attempt to parse the cookie value as a JSON array and get the first element
              const cookieArray = JSON.parse(cookieValue);
              if (Array.isArray(cookieArray) && cookieArray.length > 0 && typeof cookieArray[0] === 'string') {
                  token = cookieArray[0]; // The actual JWT is the first element
              } else {
              }
          } catch (parseError) {
              // If parsing fails, try using the raw cookie value as a fallback
              if (typeof cookieValue === 'string' && cookieValue.includes('.')) {
                  // This might be a raw JWT token (they contain two dots)
                  token = cookieValue;
              }
          }
      }
  }
  
  // If still no token, check the array format cookie (for backward compatibility)
  if (!token && req.cookies.has('sb-mnvxxmmrlvjgpnhditxc-auth-token-array')) {
      const cookieValue = req.cookies.get('sb-mnvxxmmrlvjgpnhditxc-auth-token-array').value;
      try {
          const cookieArray = JSON.parse(cookieValue);
          if (Array.isArray(cookieArray) && cookieArray.length > 0 && typeof cookieArray[0] === 'string') {
              token = cookieArray[0];
          }
      } catch (parseError) {
      }
  }


  if (!token) {
    return NextResponse.json({ message: 'Not authorized to access this route (no valid token found)' }, { status: 401 });
  }

  try {
    // Check if token is a string and clean it if needed
    if (typeof token !== 'string') {
      return NextResponse.json({ message: 'Invalid token format' }, { status: 401 });
    }
    
    // Remove any surrounding quotes or brackets that might have been included
    let cleanToken = token;
    if (token.startsWith('[') && token.endsWith(']')) {
      try {
        // Try to parse as JSON array and get first element
        const tokenArray = JSON.parse(token);
        if (Array.isArray(tokenArray) && tokenArray.length > 0) {
          cleanToken = tokenArray[0];
        }
      } catch (e) {
        // If parsing fails, try a simple string cleanup
        cleanToken = token.replace(/^\["|"\]$/g, '').replace(/^"|"$/g, '');
      }
    }
    
    // Ensure JWT_SECRET is a string and not undefined (same as in login route)
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    
    // Use the cleaned token for verification
    const decoded = jwt.verify(cleanToken, jwtSecret);

    // Fetch the user from the database
    const user = await User.findById(decoded.user.id).populate({
      path: 'roles',
      populate: {
        path: 'permissions',
      },
    });

    // Get the organization ID from the JWT token
    const organizationId = decoded.user.organizationId;

    // Verify that the user belongs to this organization
    if (organizationId && user) {
      const hasAccess = user.organizations.some(org => org.toString() === organizationId.toString());
      if (!hasAccess) {
        return NextResponse.json({ 
          message: 'You do not have access to this organization', 
          details: 'Access denied to the requested organization' 
        }, { status: 403 });
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found based on token ID' }, { status: 401 });
    }

    // In Next.js App Router, we can't directly modify the request object 
    // Instead, we'll enhance the request with custom headers that route handlers can use
    // Store user ID and organization ID in request headers
    req.headers.set('x-user-id', user._id.toString());
    req.headers.set('x-organization-id', organizationId || '');
    req.organizationId = organizationId; // Also store directly for backward compatibility
    req.user = user; // Also store directly for backward compatibility

    return null; // No error, proceed

  } catch (error) {
    // Provide more specific error messages based on the error type
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ 
        message: 'Authentication failed: Invalid token', 
        details: error.message 
      }, { status: 401 });
    } else if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ 
        message: 'Authentication failed: Token expired', 
        details: 'Please log in again to refresh your session' 
      }, { status: 401 });
    } else {
      return NextResponse.json({ 
        message: 'Not authorized to access this route', 
        details: error.message 
      }, { status: 401 });
    }
  }
};

export const authorize = (...requiredPermissions) => {
  return (req) => {
    // Get user from request object or headers
    const user = req.user || null;
    
    if (!user) {
      // This case should ideally not happen if protect middleware is used before authorize
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const userPermissions = user.roles.reduce((acc, role) => {
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
